const mongoose = require("mongoose");

/**
 * Persisted AI-assistant conversations.
 *
 * Each chat belongs to a user. Messages use the same {role, content} shape the
 * assistant page and the AI service already work with. Chats can be "saved"
 * (pinned); unpinned chats are auto-pruned so a user keeps at most the 10 most
 * recently updated unpinned chats (see chatController.pruneUnpinnedChats).
 */
const chatMessageSchema = new mongoose.Schema(
    {
        role: { type: String, enum: ["user", "assistant"], required: true },
        content: { type: String, required: true },
    },
    { timestamps: true }
);

const chatSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        title: { type: String, default: "New chat" },
        messages: [chatMessageSchema],
        isPinned: { type: Boolean, default: false },
    },
    { timestamps: true }
);

module.exports = mongoose.model("Chat", chatSchema);
