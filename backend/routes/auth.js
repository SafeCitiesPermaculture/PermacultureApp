const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
require("dotenv").config();

//define auth routes
router.post("/signup", authController.handleSignup);
router.post("/login", authController.handleLogin);
router.post("/refresh", authController.handleRefresh);
router.post("/logout", authController.handleLogout);

module.exports = router;
