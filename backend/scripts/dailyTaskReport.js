const mongoose = require("mongoose");
const cron = require("node-cron");
require("dotenv").config();
const transporter = require("../utils/transporter");

// Models
const Task = require("../models/Task");
const User = require("../models/User");

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI).then(() => {
  console.log("Connected to MongoDB");
}).catch((err) => {
  console.error("MongoDB connection error:", err);
});

// Daily report function
const sendDailyTaskReport = async () => {
  try {
    const now = new Date();
    const start = new Date(now);
    start.setUTCHours(0, 0, 0, 0);
    const end = new Date(now);
    end.setUTCHours(23, 59, 59, 999);

    // Get Safe Cities users
    const safeCityUsers = await User.find({ isSafeCities: true }).select("_id username");
    const safeCityUserIds = safeCityUsers.map(u => u._id);

    // Get tasks due today for those users
    const tasks = await Task.find({
      dueDateTime: { $gte: start, $lte: end },
      assignedTo: { $in: safeCityUserIds }
    }).populate("assignedTo", "username");

    const completed = tasks.filter(t => t.isCompleted);
    const incomplete = tasks.filter(t => !t.isCompleted);

    const reportText = `
Safe Cities Daily Task Report for ${now.toDateString()}

Completed Tasks:
${completed.length ? completed.map(t => `• ${t.name} (${t.assignedTo.username})`).join("\n") : "None"}

Incomplete Tasks:
${incomplete.length ? incomplete.map(t => `• ${t.name} (${t.assignedTo.username})`).join("\n") : "None"}
`;

    await transporter.sendMail({
      from: `"Safe Cities Reports" <${process.env.EMAIL_USERNAME}>`,
      to: process.env.EMAIL_USERNAME,
      subject: "Safe Cities – Daily Task Report",
      text: reportText,
    });

    console.log("Report sent successfully");
    console.log("Report content:\n", reportText);
  } catch (err) {
    console.error("Failed to send report:", err.message);
  }
};

// Register the cron job when run directly
if (require.main === module) {
  cron.schedule("32 23 * * *", sendDailyTaskReport, {
    timezone: "Africa/Johannesburg",
  });
}
