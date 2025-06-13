const { google } = require("googleapis");
const { Readable } = require("stream");
const File = require("../models/File");

require("dotenv").config();
const googleDriveCredentials = JSON.parse(
    process.env.GOOGLE_DRIVE_CREDENTIALS_JSON || "{}"
);
googleDriveCredentials.private_key = googleDriveCredentials.private_key.replace(
    /\\n/g,
    "\n"
);

//set up google drive api
const auth = new google.auth.JWT({
    email: googleDriveCredentials.client_email,
    key: googleDriveCredentials.private_key,
    scopes: ["https://www.googleapis.com/auth/drive"],
});
const drive = google.drive({ version: "v3", auth });

//Upload a file to google drive
const handleUpload = async (req, res) => {
    try {
        //get parent folder
        const { parent } = req.body;
        const parentFolder =
            parent !== "null" ? await File.findById(parent) : null;

        //construct metadata
        const fileMetadata = {
            name: req.file.originalname,
            parents: parentFolder?.driveFileId
                ? [parentFolder.driveFileId]
                : [],
        };

        const bufferStream = new Readable();
        bufferStream.push(req.file.buffer);
        bufferStream.push(null);

        const media = {
            mimeType: req.file.mimetype,
            body: bufferStream,
        };

        //upload to google
        const driveRes = await drive.files.create({
            resource: fileMetadata,
            media: media,
            fields: "id, webViewLink",
        });

        //share with main safe cities gmail
        await drive.permissions.create({
            fileId: driveRes.data.id,
            requestBody: {
                type: "user",
                role: "writer",
                emailAddress: "safecitiespermaculture@gmail.com",
            },
        });

        //save metadata to mongo
        const savedFile = await File.create({
            name: req.file.originalname,
            driveFileId: driveRes.data.id,
            driveLink: driveRes.data.webViewLink,
            parent: parentFolder?._id || null,
        });

        res.json({ success: true, file: savedFile });
    } catch (err) {
        console.error(err);
        res.status(500).send("Upload failed");
    }
};

//list all of the file metadatas in mongodb
const listFiles = async (req, res) => {
    try {
        const { parent } = req.query;
        const parentFolder = await File.findById(parent);

        const files = await File.find({
            parent: parentFolder?._id || null,
        }).sort({
            createdAt: -1,
        });
        res.json({ success: true, files });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to list files" });
    }
};

//retrieve a file from google drive
const getFileById = async (req, res) => {
    try {
        //get from mongo
        const fileRecord = await File.findById(req.params.id);
        if (!fileRecord) {
            return res.status(404).json({ error: "File not found in MongoDB" });
        }

        //get the file from google
        const driveRes = await drive.files.get(
            {
                fileId: fileRecord.driveFileId,
                alt: "media",
            },
            { responseType: "stream" }
        );

        //set headers
        res.setHeader(
            "Content-Disposition",
            `attachment; filename="${fileRecord.name}"`
        );

        res.setHeader("Content-Type", "application/octet-stream");
        res.setHeader("Access-Control-Expose-Headers", "Content-Disposition");

        driveRes.data.pipe(res);
    } catch (err) {
        console.error("Error downloading file from Drive:", err.message);
        res.status(500).json({ error: "Failed to download file" });
    }
};

const deleteFile = async (req, res) => {
    try {
        const { id } = req.params;

        //find file in mongo
        const file = await File.findById(id);
        if (!file) {
            return res.status(404).json({ error: "File not found in MongoDB" });
        }

        //delete from google drive
        await drive.files.delete({ fileId: file.driveFileId });

        //delete from mongo
        await File.findByIdAndDelete(id);

        res.status(200).json({
            message: "File deleted from Google Drive and MongoDB",
        });
    } catch (err) {
        console.error("Delete error:", err.message);
        res.status(500).json({ error: "Failed to delete file" });
    }
};

const createFolder = async (req, res) => {
    try {
        //get arguments
        const { name, parent } = req.body;
        const parentFolder = await File.findById(parent);

        //construct metadata
        const folderMetadata = {
            name,
            mimeType: "application/vnd.google-apps.folder",
            parents: parentFolder?.driveFileId
                ? [parentFolder.driveFileId]
                : [],
        };

        //create folder in drive
        const folder = await drive.files.create({
            resource: folderMetadata,
            fields: "id, webViewLink",
        });

        //share with Safe Cities account
        await drive.permissions.create({
            fileId: folder.data.id,
            requestBody: {
                type: "user",
                role: "writer",
                emailAddress: "safecitiespermaculture@gmail.com",
            },
        });

        //save to mongo
        const savedFolder = await File.create({
            name,
            driveFileId: folder.data.id,
            driveLink: folder.data.webViewLink,
            isFolder: true,
            parent: parentFolder?._id || null,
        });

        res.json({ success: true, folder: savedFolder });
    } catch (err) {
        console.error("Folder creation error:", err);
        res.status(500).json({ error: "Failed to create folder" });
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

module.exports = {
    handleUpload,
    listFiles,
    getFileById,
    deleteFile,
    createFolder,
    proxyGetFile,
};
