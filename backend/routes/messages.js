const express = require("express");
const router = express.Router();
const Conversation = require("../models/Conversation");
const Message = require("../models/Message");
const User = require("../models/User");

const mongoose = require("mongoose");
const ObjectId = mongoose.Types.ObjectId;

// Logging middleware
router.use((req, res, next) => {
  //console.log("Hit route:", req.method, req.originalUrl);
  next();
});


// GET /conversations - Fetch user's conversations
router.get("/conversations", async (req, res) => {
  try {
    const userId = new ObjectId(req.user._id);

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
    const { usernames } = req.body;
    const senderId = req.user._id;

    const sender = await User.findById(senderId);

    if (sender.timesReported >= 3) {
      return res.status(403).json({ message: "You have been reported and cannot start new conversations." });
    }

    if (!Array.isArray(usernames) || usernames.length === 0) {
      return res.status(400).json({ error: "Usernames array is required" });
    }

    // Look up all users
    const users = await User.find({ username: { $in: usernames } });

    if (users.length !== usernames.length) {
      return res.status(404).json({ error: "One or more users not found" });
    }

    // Create participant list including sender
    const participantIds = [...new Set([senderId, ...users.map((u) => u._id.toString())])];

    // Prevent creating conversation with just the sender
    if (participantIds.length < 2) {
      return res.status(400).json({ error: "At least one other user required" });
    }

    // Check if a conversation with the exact same participants exists
    let conversation = await Conversation.findOne({
      participants: { $all: participantIds, $size: participantIds.length },
    });

    if (!conversation) {
      conversation = new Conversation({ participants: participantIds });
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
    await Message.updateMany(
      {
        conversation: req.params.conversationId,
        seenBy: { $ne: req.user._id },
      },
      {
        $addToSet: { seenBy: req.user._id },
      }
    );
    const messages = await Message.find({ conversation: req.params.conversationId })
      .populate("sender", "username")
      .sort({ createdAt: 1 });

    res.json(messages);
  } catch (err) {
    console.error("Error fetching messages:", err);
    res.status(500).json({ error: "Failed to load messages" });
  }
});

router.get("/conversations/:conversationId", async (req, res) => {
  try {
    const convo = await Conversation.findById(req.params.conversationId)
      .populate("participants", "username");

    if (!convo) {
      return res.status(404).json({ error: "Conversation not found" });
    }

    res.json(convo);
  } catch (err) {
    console.error("Error fetching conversation:", err);
    res.status(500).json({ error: "Failed to fetch conversation" });
  }
});

 // POST /conversations/:conversationId/messages
router.post("/conversations/:conversationId/messages", async (req, res) => {
  try {
    const { text } = req.body;
    const senderId = req.user._id;
    const conversationId = req.params.conversationId;
    const user = await User.findById(senderId);

    if (user.timesReported >= 3) {
      return res.status(403).json({ message: "You have been reported and cannot send messages." });
    }

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

    // Mark messages as delivered
    await Message.updateMany(
      {
        conversation: req.params.conversationId,
        deliveredTo: { $ne: req.user._id },
      },
      {
        $addToSet: { deliveredTo: req.user._id },
      }
    );

    const populated = await message.populate("sender", "username");
    res.status(201).json(populated);
  } catch (err) {
    console.error("Error sending message:", err);
    res.status(500).json({ error: "Failed to send message" });
  }
});

router.put("/conversations/:id/rename", async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) return res.status(400).json({ error: "Name required" });

    const convo = await Conversation.findByIdAndUpdate(
      req.params.id,
      { name },
      { new: true }
    ).populate("participants", "username");

    res.json(convo);
  } catch (err) {
    console.error("Rename error:", err);
    res.status(500).json({ error: "Failed to rename group" });
  }
});


module.exports = router;
