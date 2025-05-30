const mongoose = require("mongoose");

const fileSchema = new mongoose.Schema({
    name: String,
    driveFileId: String,
    driveLink: String,
    uploadedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("File", fileSchema);
