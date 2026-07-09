const { google } = require("googleapis");
const { Readable } = require("stream");
const Chat = require("../models/Chat");
const { triggerAiReindex } = require("../utils/aiReindex");

require("dotenv").config();
const googleDriveCredentials = JSON.parse(
    process.env.GOOGLE_DRIVE_CREDENTIALS_JSON || "{}"
);
googleDriveCredentials.private_key = googleDriveCredentials.private_key.replace(
    /\\n/g,
    "\n"
);

// Service account client — used for READING/downloading files. It owns the
// legacy docs and is shared on new ones, so it can read everything. (It cannot
// CREATE files: service accounts have no Drive storage quota.)
const auth = new google.auth.JWT({
    email: googleDriveCredentials.client_email,
    key: googleDriveCredentials.private_key,
    scopes: ["https://www.googleapis.com/auth/drive"],
});
const drive = google.drive({ version: "v3", auth });

// Google Drive is the single source of truth for the Documents tab. The root of
// the file browser is this folder; drilling into a subfolder passes that
// subfolder's Drive ID as `parent`. The AI corpus indexes the same folder tree,
// so the Documents tab and the assistant stay in sync.
const DOCUMENTS_ROOT_FOLDER_ID = process.env.DOCUMENTS_ROOT_FOLDER_ID;

const FOLDER_MIME = "application/vnd.google-apps.folder";

// Google-native docs can't be downloaded with alt=media; they must be exported.
// We export to the most broadly-useful format for a human download.
const GOOGLE_EXPORT = {
    "application/vnd.google-apps.document": ["application/pdf", ".pdf"],
    "application/vnd.google-apps.spreadsheet": [
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        ".xlsx",
    ],
    "application/vnd.google-apps.presentation": ["application/pdf", ".pdf"],
};

// OAuth client acting as the real Gmail account (15GB quota) — used for CREATING
// files/folders and deleting app-created ones. Files it creates are owned by the
// Gmail account, so uploads actually succeed.
const SERVICE_ACCOUNT_EMAIL = googleDriveCredentials.client_email;
const oauthClient = new google.auth.OAuth2(
    process.env.GOOGLE_OAUTH_CLIENT_ID,
    process.env.GOOGLE_OAUTH_CLIENT_SECRET
);
oauthClient.setCredentials({
    refresh_token: process.env.GOOGLE_OAUTH_REFRESH_TOKEN,
});
const driveOwner = google.drive({ version: "v3", auth: oauthClient });

// The human Gmail account that owns the Drive storage quota. Folders created by
// the service account are shared with it as a writer so uploads can land inside.
const OWNER_EMAIL =
    process.env.DRIVE_OWNER_EMAIL || "safecitiespermaculture@gmail.com";

// Share a newly-created Drive file with the service account (reader) so the
// service-account reader/indexer can access it.
const shareWithServiceAccount = async (fileId) => {
    if (!SERVICE_ACCOUNT_EMAIL) return;
    try {
        await driveOwner.permissions.create({
            fileId,
            requestBody: {
                type: "user",
                role: "reader",
                emailAddress: SERVICE_ACCOUNT_EMAIL,
            },
        });
    } catch (err) {
        console.error("Failed to share with service account:", err.message);
    }
};

// Share a service-account-created folder with the Gmail owner as a writer, so
// the owner (which holds the storage quota) can upload files into it.
const shareWithOwner = async (fileId) => {
    try {
        await drive.permissions.create({
            fileId,
            requestBody: {
                type: "user",
                role: "writer",
                emailAddress: OWNER_EMAIL,
            },
            sendNotificationEmail: false,
        });
    } catch (err) {
        console.error("Failed to share with owner:", err.message);
    }
};

//Upload a file to google drive. `parent` is a Drive folder id (or "null"/empty
//for the documents root). Drive is the source of truth, so nothing is written
//to Mongo. Files are created by the Gmail account (it has storage quota) and
//shared with the service account so the reader/indexer can access them.
const handleUpload = async (req, res) => {
    try {
        const { parent } = req.body;
        const parentId =
            parent && parent !== "null" ? parent : DOCUMENTS_ROOT_FOLDER_ID;

        const fileMetadata = {
            name: req.file.originalname,
            parents: parentId ? [parentId] : [],
        };

        const bufferStream = new Readable();
        bufferStream.push(req.file.buffer);
        bufferStream.push(null);

        const media = {
            mimeType: req.file.mimetype,
            body: bufferStream,
        };

        const driveRes = await driveOwner.files.create({
            resource: fileMetadata,
            media: media,
            fields: "id, name, mimeType, webViewLink",
        });

        await shareWithServiceAccount(driveRes.data.id);

        // New uploads default to inCorpus, so the AI should pick them up now
        // rather than on the next scheduled sweep.
        triggerAiReindex("upload");

        res.json({
            success: true,
            file: {
                _id: driveRes.data.id,
                driveFileId: driveRes.data.id,
                name: driveRes.data.name,
                isFolder: false,
                mimeType: driveRes.data.mimeType,
                driveLink: driveRes.data.webViewLink,
                showInDocs: true,
                inCorpus: true,
            },
        });
    } catch (err) {
        console.error("Upload failed:", err.message);
        res.status(500).send("Upload failed");
    }
};

//list a Drive folder's children live (Drive is the source of truth). `parent`
//is a Drive folder ID; absent/null means the configured documents root. The
//Drive ID is returned as `_id` so existing clients keep navigating/downloading
//by `f._id` with no changes.
const listFiles = async (req, res) => {
    try {
        const { parent } = req.query;
        const folderId =
            parent && parent !== "null" ? parent : DOCUMENTS_ROOT_FOLDER_ID;

        if (!folderId) {
            return res
                .status(500)
                .json({ error: "DOCUMENTS_ROOT_FOLDER_ID is not configured" });
        }

        // Admins see everything (including docs hidden from the Documents tab)
        // so they can toggle visibility; regular users never see hidden docs.
        const isAdmin = req.user?.userRole === "admin";

        const files = [];
        let pageToken = null;
        do {
            const resp = await drive.files.list({
                q: `'${folderId}' in parents and trashed = false`,
                fields:
                    "nextPageToken, files(id, name, mimeType, modifiedTime, webViewLink, properties)",
                pageSize: 1000,
                pageToken,
                orderBy: "folder,name",
            });

            for (const f of resp.data.files) {
                const { showInDocs, inCorpus } = readFlags(f.properties);
                if (!isAdmin && !showInDocs) continue;
                files.push({
                    _id: f.id, // Drive ID — clients navigate/download by this
                    driveFileId: f.id,
                    name: f.name,
                    isFolder: f.mimeType === FOLDER_MIME,
                    mimeType: f.mimeType,
                    driveLink: f.webViewLink,
                    uploadedAt: f.modifiedTime,
                    showInDocs,
                    inCorpus,
                });
            }
            pageToken = resp.data.nextPageToken;
        } while (pageToken);

        res.json({ success: true, files });
    } catch (err) {
        console.error("listFiles (Drive) error:", err.message);
        res.status(500).json({ error: "Failed to list files" });
    }
};

// Per-document admin visibility flags, stored as custom `properties` on the
// Drive file so Drive stays the single source of truth (no separate DB). Absent
// property = included by default.
//   scShowInDocs = "false"  -> hidden from the website Documents tab
//   scInCorpus   = "false"  -> excluded from the AI knowledge corpus
const readFlags = (properties) => {
    const p = properties || {};
    return {
        showInDocs: p.scShowInDocs !== "false",
        inCorpus: p.scInCorpus !== "false",
    };
};

// Admin: set/clear the two visibility flags on a Drive file. Body may include
// `showInDocs` and/or `inCorpus` booleans. Writes via the client that can edit
// the file (Gmail owner for new uploads, service account for legacy files).
const setFileFlags = async (req, res) => {
    try {
        const { id } = req.params;
        const { showInDocs, inCorpus } = req.body;

        const properties = {};
        if (typeof showInDocs === "boolean") {
            properties.scShowInDocs = showInDocs ? "true" : "false";
        }
        if (typeof inCorpus === "boolean") {
            properties.scInCorpus = inCorpus ? "true" : "false";
        }
        if (!Object.keys(properties).length) {
            return res
                .status(400)
                .json({ error: "Provide showInDocs and/or inCorpus (boolean)" });
        }

        const requestBody = { properties };
        try {
            await driveOwner.files.update({ fileId: id, requestBody });
        } catch (ownerErr) {
            await drive.files.update({ fileId: id, requestBody });
        }

        // Only the corpus flag affects the AI index (toggling on adds the
        // file, toggling off gets it pruned); showInDocs alone doesn't.
        if (typeof inCorpus === "boolean") {
            triggerAiReindex("corpus toggle");
        }

        res.json({ success: true, flags: { showInDocs, inCorpus } });
    } catch (err) {
        console.error("setFileFlags error:", err.message);
        res.status(500).json({ error: "Failed to update visibility flags" });
    }
};

//retrieve a file from google drive by its Drive file ID (the `_id` returned by
//listFiles). Google-native docs are exported; everything else is downloaded
//as-is. Pass ?inline=1 to get viewer-friendly headers (real mimetype +
//Content-Disposition inline) so the browser can render the file in-page.
const getFileById = async (req, res) => {
    try {
        const fileId = req.params.id;
        const inline = req.query.inline === "1";

        //look up the name + type so we can name the download and decide whether
        //to export (Google-native) or stream the raw bytes.
        const meta = await drive.files.get({
            fileId,
            fields: "name, mimeType",
        });
        const { name, mimeType } = meta.data;

        let downloadName = name || "download";
        let contentType = mimeType || "application/octet-stream";
        let driveRes;
        if (GOOGLE_EXPORT[mimeType]) {
            const [exportMime, ext] = GOOGLE_EXPORT[mimeType];
            if (!downloadName.toLowerCase().endsWith(ext)) {
                downloadName += ext;
            }
            contentType = exportMime;
            driveRes = await drive.files.export(
                { fileId, mimeType: exportMime },
                { responseType: "stream" }
            );
        } else {
            driveRes = await drive.files.get(
                { fileId, alt: "media" },
                { responseType: "stream" }
            );
        }

        //set headers
        res.setHeader(
            "Content-Disposition",
            `${inline ? "inline" : "attachment"}; filename="${downloadName}"`
        );

        res.setHeader(
            "Content-Type",
            inline ? contentType : "application/octet-stream"
        );
        res.setHeader("Access-Control-Expose-Headers", "Content-Disposition");

        driveRes.data.pipe(res);
    } catch (err) {
        console.error("Error downloading file from Drive:", err.message);
        res.status(500).json({ error: "Failed to download file" });
    }
};

//Delete a file or folder from Drive by its Drive id. Drive cascades folder
//deletes to their children, so no manual recursion is needed. New files are
//owned by the Gmail account (OAuth), legacy files by the service account; try
//the owner, fall back to the other.
const deleteFile = async (req, res) => {
    try {
        const { id } = req.params;
        try {
            await driveOwner.files.delete({ fileId: id });
        } catch (ownerErr) {
            await drive.files.delete({ fileId: id });
        }
        // Prune the deleted file's chunks from the AI index right away.
        triggerAiReindex("delete");
        res.status(200).json({ message: "File deleted from Google Drive" });
    } catch (err) {
        console.error("Delete error:", err.message);
        res.status(500).json({ error: "Failed to delete file" });
    }
};

//Create a folder in Drive under `parent` (a Drive folder id, or root). Folders
//are created by the service account (zero-byte, so no storage quota needed —
//and it can write at the top level of its own Drive), then shared with the
//Gmail owner as a writer so files can be uploaded into the folder afterwards.
const createFolder = async (req, res) => {
    try {
        const { name, parent } = req.body;
        const parentId =
            parent && parent !== "null" ? parent : DOCUMENTS_ROOT_FOLDER_ID;

        const folderMetadata = {
            name,
            mimeType: FOLDER_MIME,
            parents: parentId ? [parentId] : [],
        };

        const folder = await drive.files.create({
            resource: folderMetadata,
            fields: "id, name, webViewLink",
        });

        await shareWithOwner(folder.data.id);

        res.json({
            success: true,
            folder: {
                _id: folder.data.id,
                driveFileId: folder.data.id,
                name: folder.data.name,
                isFolder: true,
                driveLink: folder.data.webViewLink,
                showInDocs: true,
                inCorpus: true,
            },
        });
    } catch (err) {
        console.error("Folder creation error:", err.message);
        res.status(500).json({ error: "Failed to create folder" });
    }
};

// Saved AI conversations live in this folder directly under the documents
// root, so they show up in the Documents tab and in the AI corpus walk. The
// name matches the ai-service's existing write-back folder ("Saved Answers",
// see ai_conversations_folder_name in ai-service config) so both features
// share one folder instead of creating duplicates.
const AI_CONVERSATIONS_FOLDER = "Saved Answers";

// Find (or create) the AI Conversations folder under the documents root. Like
// createFolder: the service account creates it (zero-byte, no quota needed) and
// shares it with the Gmail owner so file uploads can land inside.
const ensureConversationsFolder = async () => {
    const resp = await drive.files.list({
        q: `'${DOCUMENTS_ROOT_FOLDER_ID}' in parents and name = '${AI_CONVERSATIONS_FOLDER}' and mimeType = '${FOLDER_MIME}' and trashed = false`,
        fields: "files(id)",
        pageSize: 1,
    });
    if (resp.data.files.length) return resp.data.files[0].id;

    const folder = await drive.files.create({
        resource: {
            name: AI_CONVERSATIONS_FOLDER,
            mimeType: FOLDER_MIME,
            parents: [DOCUMENTS_ROOT_FOLDER_ID],
        },
        fields: "id",
    });
    await shareWithOwner(folder.data.id);
    return folder.data.id;
};

// Save an AI-assistant conversation (a Chat document) into the AI Conversations
// Drive folder as markdown. Re-saving the same chat updates its existing Drive
// file (matched by the scChatId property) instead of creating duplicates.
const saveConversation = async (req, res) => {
    try {
        const { chatId } = req.body;
        if (!chatId) {
            return res.status(400).json({ error: "chatId is required" });
        }
        if (!DOCUMENTS_ROOT_FOLDER_ID) {
            return res
                .status(500)
                .json({ error: "DOCUMENTS_ROOT_FOLDER_ID is not configured" });
        }

        const chat = await Chat.findById(chatId);
        if (!chat) {
            return res.status(404).json({ error: "Conversation not found" });
        }
        const isOwner = chat.user.toString() === req.user._id.toString();
        if (!isOwner && req.user.userRole !== "admin") {
            return res.status(403).json({ error: "Not your conversation" });
        }
        if (!chat.messages.length) {
            return res
                .status(400)
                .json({ error: "This conversation has no messages yet" });
        }

        const folderId = await ensureConversationsFolder();

        const title = chat.title || "AI conversation";
        const savedOn = new Date().toISOString().slice(0, 10);
        const lines = [
            `# ${title}`,
            "",
            `Saved by ${req.user.username} on ${savedOn}`,
            "",
        ];
        for (const m of chat.messages) {
            lines.push(m.role === "user" ? "## You" : "## Assistant", "", m.content, "");
        }

        const bufferStream = new Readable();
        bufferStream.push(lines.join("\n"));
        bufferStream.push(null);
        const media = { mimeType: "text/markdown", body: bufferStream };
        const fileName = `${title}.md`;

        const existing = await drive.files.list({
            q: `'${folderId}' in parents and properties has { key='scChatId' and value='${chat._id}' } and trashed = false`,
            fields: "files(id)",
            pageSize: 1,
        });

        let fileId;
        if (existing.data.files.length) {
            fileId = existing.data.files[0].id;
            await driveOwner.files.update({
                fileId,
                resource: { name: fileName },
                media,
            });
        } else {
            const created = await driveOwner.files.create({
                resource: {
                    name: fileName,
                    parents: [folderId],
                    // Saved conversations show in the Docs tab but stay OUT of
                    // the AI knowledge corpus until an admin explicitly toggles
                    // them on there (updates preserve whatever the admin set).
                    properties: {
                        scChatId: String(chat._id),
                        scInCorpus: "false",
                    },
                },
                media,
                fields: "id",
            });
            fileId = created.data.id;
            await shareWithServiceAccount(fileId);
        }

        // No reindex trigger here: new saves are excluded from the corpus by
        // default, so nothing changes for the AI until the admin corpus toggle
        // (which fires its own trigger).

        res.json({ success: true, fileId, folderId });
    } catch (err) {
        console.error("saveConversation error:", err.message);
        res.status(500).json({
            error: "Could not save the conversation to Documents",
        });
    }
};

const proxyGetFile = async (req, res) => {
    const driveUrl = req.query.url;
    if (!driveUrl) {
        return res.status(400).send("Missing 'url' query parameter");
    }

    if (!driveUrl.startsWith("https://drive.google.com/uc?")) {
        return res.status(400).send("Only Google Drive URLs are allowed");
    }

    try {
        const response = await fetch(driveUrl);
        if (!response.ok) {
            return res.status(response.status).send("Failed to fetch image");
        }

        res.set(
            "Content-Type",
            response.headers.get("content-type") || "image/jpeg"
        );
        const stream = Readable.fromWeb(response.body);
        stream.pipe(res);
    } catch (err) {
        console.error("Error fetching file:", err);
        res.status(500).send("Proxy error");
    }
};

//helper conversion functions
function bytesToMB(bytes) {
    return Number((bytes / (1024 * 1024)).toFixed(2));
}

function bytesToGB(bytes) {
    return Number((bytes / (1024 * 1024 * 1024)).toFixed(2));
}

//returns the amount of storage used in the drive
const getStorageUsage = async (req, res) => {
    try {
        const response = await drive.about.get({
            fields: "storageQuota",
        });

        const quota = response.data.storageQuota;
        /*
        storageQuota fields:
        - limit (string): total storage quota in bytes (may be "unlimited")
        - usage (string): total bytes used
        - usageInDrive (string): bytes used by Drive files
        - usageInDriveTrash (string): bytes used by files in trash
        */

        // Convert strings to numbers first (Google returns strings)
        const usageBytes = Number(quota.usage) || 0;
        const limitBytes =
            quota.limit === "unlimited" ? null : Number(quota.limit);
        const usageInDriveBytes = Number(quota.usageInDrive) || 0;
        const usageInTrashBytes = Number(quota.usageInDriveTrash) || 0;

        res.json({
            limitBytes,
            usageBytes,
            usageInDriveBytes,
            usageInTrashBytes,

            usageMB: bytesToMB(usageBytes),
            usageGB: bytesToGB(usageBytes),

            limitMB: limitBytes ? bytesToMB(limitBytes) : "unlimited",
            limitGB: limitBytes ? bytesToGB(limitBytes) : "unlimited",
        });
    } catch (err) {
        console.error("Error getting storage usage", err);
        res.status(500).send("Error getting storage usage");
    }
};

//delete all files in the google drive
const purgeDrive = async (req, res) => {
    try {
        // Get all files (including trashed: false)
        let nextPageToken = null;

        do {
            const response = await drive.files.list({
                q: "'me' in owners and trashed = false",
                fields: "nextPageToken, files(id, name)",
                pageToken: nextPageToken,
                pageSize: 1000, // max allowed is 1000
            });

            const files = response.data.files;

            if (files.length === 0) break;

            // Delete files one by one (could also batch, but no batch endpoint in REST v3)
            for (const file of files) {
                try {
                    await drive.files.delete({ fileId: file.id });
                    console.log(`Deleted file: ${file.name} (${file.id})`);
                } catch (err) {
                    console.error(`Error deleting file ${file.name}:`, err);
                }
            }

            nextPageToken = response.data.nextPageToken;
        } while (nextPageToken);

        res.json({ success: true, message: "All files deleted" });
    } catch (error) {
        console.error("Error purging drive:", error);
        res.status(500).json({ success: false, error: error.message });
    }
};

module.exports = {
    handleUpload,
    listFiles,
    saveConversation,
    getFileById,
    setFileFlags,
    deleteFile,
    createFolder,
    proxyGetFile,
    getStorageUsage,
    purgeDrive,
};
