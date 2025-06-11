const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");
const multer = require("multer");

//configure local storage
const storage = multer.memoryStorage();
const upload = multer({ storage });

//define user routes
router.put(
    "/image/:id",
    upload.single("file"),
    userController.updateProfilePicture
);
router.put("/reset-password", userController.changePassword);

module.exports = router;
