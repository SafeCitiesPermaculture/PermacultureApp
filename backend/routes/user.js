const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");
const multer = require("multer");
const User = require('../models/User');
const bcrypt = require('bcryptjs');

//configure local storage
const storage = multer.memoryStorage();
const upload = multer({ storage });

//define user routes
router.put(
    "/image/:id",
    upload.single("file"),
    userController.updateProfilePicture
);
router.put("/change-password", userController.changePassword);

// PUT /user/update-profile
router.put('/update-profile', async (req, res) => {
  try {
    const userId = req.user._id;
    const { username, email, farms } = req.body;

    const update = {};
    if (username) update.username = username;
    if (email) update.email = email;
    // `farms` is an array of Farm ids (empty array to unassign).
    if (Array.isArray(farms)) update.farms = farms;

    const updatedUser = await User.findByIdAndUpdate(userId, update, { new: true })
      .populate("farms", "name");
    res.json({ message: 'Profile updated', user: updatedUser });
  } catch (err) {
    console.error('Update profile error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// GET /api/user/search?q=… — case-insensitive partial username match, for the
// start-a-chat picker. Returns at most 8 users (never the caller) with just
// the fields the UI needs (name + avatar).
router.get("/search", async (req, res) => {
  try {
    const q = (req.query.q || "").trim();
    if (!q) return res.json({ users: [] });
    const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const users = await User.find({
      username: { $regex: escaped, $options: "i" },
      _id: { $ne: req.user._id },
    })
      .select("username profilePicture")
      .limit(8);
    res.json({ users });
  } catch (err) {
    console.error("GET /user/search failed:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// GET /api/user/me
router.get("/me", async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate("farms", "name");
    res.json({
      _id: user._id,
      username: user.username,
      email: user.email,
      farms: user.farms,                     // [{ _id, name }]
      farmName: user.farms?.length ? user.farms.map((f) => f.name).join(", ") : "",
    });
  } catch (err) {
    console.error("GET /me failed:", err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
