const mongoose = require("mongoose");
const nodemailer = require("nodemailer");
const cron = require("node-cron");
require("dotenv").config();

// Models
const Task = require("../models/Task");
const User = require("../models/User");

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => {
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
${completed.length ? completed.map(t => `• ${t.name} (by ${t.assignedTo.username})`).join("\n") : "None"}

Incomplete Tasks:
${incomplete.length ? incomplete.map(t => `• ${t.name} (${t.assignedTo.username})`).join("\n") : "None"}
`;

    // Send the email
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.REPORT_EMAIL,
        pass: process.env.REPORT_PASSWORD,
      },
    });

    await transporter.sendMail({
      from: `"Safe Cities Reports" <${process.env.REPORT_EMAIL}>`,
      to: process.env.REPORT_RECIPIENT,
      subject: "Safe Cities – Daily Task Report",
      text: reportText,
    });

    console.log("Report sent successfully");
    console.log("Report content:\n", reportText);
  } catch (err) {
    console.error("Failed to send report:", err.message);
  }
};

// Schedule for daily 22:00 (server time)
cron.schedule("0 22 * * *", sendDailyTaskReport);

// Run manually if called directly
if (require.main === module) {
  sendDailyTaskReport().then(() => process.exit(0));
}
