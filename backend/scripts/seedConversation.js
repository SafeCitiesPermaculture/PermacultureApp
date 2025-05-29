
// scripts/seedConversation.js
const mongoose = require("mongoose");
const User = require("../models/User");
const Conversation = require("../models/Conversation");
const Message = require("../models/Message");
require("dotenv").config();

(async () => {
  await mongoose.connect(process.env.MONGODB_URI);

  const user1 = await User.findOne({ username: "goon" });
  let user2 = await User.findOne({ username: "tester" });

  if (!user2) {
    user2 = new User({ username: "tester", email: "tester@test.com", password: "test123" });
    await user2.save();
  }

  const convo = new Conversation({
    participants: [user1._id, user2._id],
    lastMessage: "Hey goon, this is your test message!",
  });

  await convo.save();

  const message = new Message({
    conversation: convo._id,
    sender: user2._id,
    text: "Hey goon, this is your test message!",
  });

  await message.save();

  console.log("Conversation and message seeded.");
  process.exit(0);
})();
