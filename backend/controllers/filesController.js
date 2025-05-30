const { google } = require("googleapis");
const { Readable } = require("stream");
const path = require("path");
const File = require("../models/File");

//set up google drive api
const auth = new google.auth.GoogleAuth({
    keyFile: path.join(
        __dirname,
        "../credentials/google_drive_credentials.json"
    ),
    scopes: ["https://www.googleapis.com/auth/drive"],
});
const drive = google.drive({ version: "v3", auth });

//Upload a file to google drive
const handleUpload = async (req, res) => {
    try {
        // console.log("Received file", req.file);

        const fileMetadata = {
            name: req.file.originalname,
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
        });

        console.log("Uploaded successfully:", driveRes);

        res.json({ success: true, file: savedFile });
    } catch (err) {
        console.error(err);
        res.status(500).send("Upload failed");
    }
};

module.exports = { handleUpload };
