const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");

//define auth routes
router.post("/signup", authController.handleSignup);
router.post("/login", authController.handleLogin);
router.post("/refresh", authController.handleRefresh);
router.post("/logout", authController.handleLogout);
router.get("/userdata", authController.refreshUserData);
router.put("/reset-password", authController.sendResetPasswordEmail);
router.put("/reset-password/:resetPasswordToken", authController.resetPasswordWithToken);

module.exports = router;
