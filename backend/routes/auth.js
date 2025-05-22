const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
require("dotenv").config();

//define auth routes
router.post("/signup", authController.handleSignup);
router.post("/login", authController.handleLogin);

module.exports = router;
