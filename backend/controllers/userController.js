const User = require("../models/User");
const { google } = require("googleapis");
const { Readable } = require("stream");
const path = require("path");
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

//set the profile picture for the user
const updateProfilePicture = async (req, res) => {
    try {
        //get uploaded data
        const { id } = req.params;
        const file = req.file;

        if (!file) {
            return res.status(400).json({ error: "No file uploaded" });
        }

        const user = await User.findById(id);

        if (!user) {
            return res.status(404).json({ error: "Could not find user" });
        }

        //store old picture url for deletion
        const oldPictureUrl = user.profilePicture;

        //send to google drive
        const fileMetadata = {
            name: file.originalname,
            parent: null,
        };

        const bufferStream = new Readable();
        bufferStream.push(req.file.buffer);
        bufferStream.push(null);

        const media = {
            mimeType: req.file.mimetype,
            body: bufferStream,
        };

        const response = await drive.files.create({
            resource: fileMetadata,
            media,
            fields: "id",
        });

        const fileId = response.data.id;

        //make file public
        await drive.permissions.create({
            fileId,
            requestBody: {
                role: "reader",
                type: "anyone",
            },
        });

        //share with main safe cities gmail
        await drive.permissions.create({
            fileId: response.data.id,
            requestBody: {
                type: "user",
                role: "writer",
                emailAddress: "safecitiespermaculture@gmail.com",
            },
        });

        //get link
        const publicUrl = `https://drive.google.com/uc?id=${fileId}`;

        //add to user
        user.profilePicture = publicUrl;
        await user.save();

        //attempt to delete old picture
        const match = oldPictureUrl.match(/id=([^&]+)/);
        if (match) {
            const oldFileId = match[1];
            await drive.files.delete({ fileId: oldFileId });
        }

        res.status(200).json({ url: publicUrl });
    } catch (err) {
        console.log("Error uploading image", err);
        res.status(500).json({ error: "Image upload failed" });
    }
};

module.exports = { updateProfilePicture };
