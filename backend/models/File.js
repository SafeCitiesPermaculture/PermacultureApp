const mongoose = require("mongoose");

const fileSchema = new mongoose.Schema({
    name: String,
    driveFileId: String,
    driveLink: String,
    parent: { type: mongoose.Schema.Types.ObjectId, ref: "File" },
    isFolder: { type: Boolean, default: false },
    uploadedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("File", fileSchema);
