const express = require("express");
const router = express.Router();
const Conversation = require("../models/Conversation");
const Message = require("../models/Message");
const User = require("../models/User");

// Logging middleware
router.use((req, res, next) => {
    console.log("Hit route:", req.method, req.originalUrl);
    next();
});

/**
 * GET /conversations
 * Return all conversations for the authenticated user
 */
router.get("/conversations", async (req, res) => {
    try {
        const userId = req.user.userId;
        const conversations = await Conversation.find({ participants: userId })
            .populate("participants", "username")
            .sort({ updatedAt: -1 });
        res.json(conversations);
    } catch (err) {
        console.error("Error fetching conversations:", err);
        res.status(500).json({ error: "Failed to load conversations" });
    }
});

/**
 * POST /conversations
 * Create or fetch existing conversation with a recipient
 */
router.post("/conversations", async (req, res) => {
    try {
        const { recipientUsername } = req.body;
        const senderId = req.user.userId;

        const recipient = await User.findOne({ username: recipientUsername });
        if (!recipient)
            return res.status(404).json({ error: "Recipient not found" });

        let conversation = await Conversation.findOne({
            participants: { $all: [senderId, recipient._id] },
        });

        if (!conversation) {
            conversation = new Conversation({
                participants: [senderId, recipient._id],
            });
            await conversation.save();
        }

        const populated = await conversation.populate(
            "participants",
            "username"
        );
        res.status(201).json(populated);
    } catch (err) {
        console.error("Error starting conversation:", err);
        res.status(500).json({ error: "Failed to start conversation" });
    }
});

/**
 * GET /conversations/:conversationId/messages
 * Return all messages in a specific conversation
 */
router.get("/conversations/:conversationId/messages", async (req, res) => {
    try {
        const messages = await Message.find({
            conversation: req.params.conversationId,
        })
            .populate("sender", "username")
            .sort({ createdAt: 1 });
        res.json(messages);
    } catch (err) {
        console.error("Error fetching messages:", err);
        res.status(500).json({ error: "Failed to load messages" });
    }
});

/**
 * POST /conversations/:conversationId/messages
 * Send a message in a specific conversation
 */
router.post("/conversations/:conversationId/messages", async (req, res) => {
    try {
        const { text } = req.body;
        const senderId = req.user.userId;
        const conversationId = req.params.conversationId;

        const message = new Message({
            conversation: conversationId,
            sender: senderId,
            text,
        });
        await message.save();

        await Conversation.findByIdAndUpdate(conversationId, {
            lastMessage: text,
            updatedAt: new Date(),
        });

        const populated = await message.populate("sender", "username");
        res.status(201).json(populated);
    } catch (err) {
        console.error("Error sending message:", err);
        res.status(500).json({ error: "Failed to send message" });
    }
});

module.exports = router;
