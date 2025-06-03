const express = require("express");
const router = express.Router();
const Conversation = require("../models/Conversation");
const Message = require("../models/Message");
const User = require("../models/User");

const mongoose = require("mongoose");
const ObjectId = mongoose.Types.ObjectId;

// Logging middleware
router.use((req, res, next) => {
  console.log("Hit route:", req.method, req.originalUrl);
  next();
});


// GET /conversations - Fetch user's conversations
router.get("/conversations", async (req, res) => {
  try {
    const userId = new ObjectId(req.user._id);
    console.log("Looking for conversations with participant:", userId);

    let conversations = await Conversation.find({ participants: userId })
      .populate("participants", "username")
      .sort({ updatedAt: -1 });

    conversations = conversations.map((convo) => {
      const otherUser = convo.participants.find(
        (p) => p._id.toString() !== req.user._id
      );
      return {
        ...convo.toObject(),
        otherUser,
      };
    });

    res.json(conversations);
  } catch (err) {
    console.error("Error fetching conversations:", err);
    res.status(500).json({ error: "Failed to load conversations" });
  }
});

/**
 * POST /conversations
 * Create or fetch existing conversation with another user
 */
router.post("/conversations", async (req, res) => {
  try {
    const { username } = req.body;
    const senderId = req.user._id;

    if (!username) {
      return res.status(400).json({ error: "Username is required" });
    }

    const recipient = await User.findOne({ username });
    if (!recipient) {
      return res.status(404).json({ error: "User not found" });
    }

    // Prevent chatting with yourself
    if (recipient._id.equals(senderId)) {
      return res.status(400).json({ error: "Cannot start a chat with yourself" });
    }

    let conversation = await Conversation.findOne({
      participants: { $all: [senderId, recipient._id], $size: 2 },
    });

    if (!conversation) {
      conversation = new Conversation({
        participants: [senderId, recipient._id],
      });
      await conversation.save();
    }

    const populated = await conversation.populate("participants", "username");
    res.status(201).json(populated);
  } catch (err) {
    console.error("Error starting conversation:", err);
    res.status(500).json({ error: "Failed to start conversation" });
  }
});

/**
 * GET /conversations/:conversationId/messages
 */
router.get("/conversations/:conversationId/messages", async (req, res) => {
  try {
    const messages = await Message.find({ conversation: req.params.conversationId })
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
 */
router.post("/conversations/:conversationId/messages", async (req, res) => {
  try {
    const { text } = req.body;
    const senderId = req.user._id;
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
