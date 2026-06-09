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

    // Get users that belong to at least one farm
    const farmUsers = await User.find({ farms: { $exists: true, $ne: [] } }).select("_id");
    const farmUserIds = farmUsers.map(u => u._id);

    // Get tasks due today for those users, including who completed them.
    const tasks = await Task.find({
      dueDateTime: { $gte: start, $lte: end },
      assignedTo: { $in: farmUserIds }
    })
      .populate({ path: "assignedTo", select: "username farms", populate: { path: "farms", select: "name" } })
      .populate("completedBy", "username");

    // Group tasks by farm name. A user in multiple farms has their task listed
    // under each of those farms.
    const farmsOf = (t) => {
      const fs = t.assignedTo?.farms;
      return fs && fs.length ? fs.map((f) => f.name) : ["Unassigned"];
    };
    const byFarm = {};
    for (const t of tasks) {
      for (const farmName of farmsOf(t)) {
        (byFarm[farmName] = byFarm[farmName] || []).push(t);
      }
    }

    const renderTask = (t) => {
      const note = t.completionNote ? ` — note: ${t.completionNote}` : "";
      return `• ${t.name} (${t.assignedTo.username})${t.isCompleted ? note : ""}`;
    };

    const sections = Object.keys(byFarm).sort().map((farmName) => {
      const farmTasks = byFarm[farmName];
      const completed = farmTasks.filter(t => t.isCompleted);
      const incomplete = farmTasks.filter(t => !t.isCompleted);
      return `
=== ${farmName} ===
Completed Tasks:
${completed.length ? completed.map(renderTask).join("\n") : "None"}

Incomplete Tasks:
${incomplete.length ? incomplete.map(renderTask).join("\n") : "None"}`;
    });

    const reportText = `
Daily Task Report for ${now.toDateString()}
${sections.length ? sections.join("\n") : "\nNo tasks due today."}
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
