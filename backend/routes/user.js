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

// PUT /users/update-profile
router.put('/update-profile', async (req, res) => {
  try {
    const userId = req.user._id;
    const { username, password, farmName } = req.body;

    const update = {};
    if (username) update.username = username;
    if (farmName) update.farmName = farmName;
    if (password) update.password = await bcrypt.hash(password, 10);

    const updatedUser = await User.findByIdAndUpdate(userId, update, { new: true });
    res.json({ message: 'Profile updated', user: updatedUser });
  } catch (err) {
    console.error('Update profile error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// GET /api/users/me
router.get("/me", async (req, res) => {
  try {
    const user = req.user;
    res.json({
      _id: user._id,
      username: user.username,
      email: user.email,
      farmName: user.farmName,
    });
  } catch (err) {
    console.error("GET /me failed:", err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
