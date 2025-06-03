const mongoose = require("mongoose");

const ConversationSchema = new mongoose.Schema(
  {
    name: { type: String, default: "" },
    participants: [
      { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }
    ],
    lastMessage: { type: String },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Conversation", ConversationSchema);

