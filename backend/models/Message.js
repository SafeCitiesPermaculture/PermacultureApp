const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema(
    {
        conversation: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Conversation",
            required: true,
        },
        sender: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        text: {
            type: String,
            required: true,
        },
        deliveredTo: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: [],
        }],
        seenBy: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: [],
        }],
    },
    { timestamps: true }
);

module.exports = mongoose.model("Message", messageSchema);
