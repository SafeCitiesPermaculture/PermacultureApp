const express = require("express");
const router = express.Router();
const filesController = require("../controllers/filesController");
const multer = require("multer");

//configure local storage
const storage = multer.memoryStorage();
const upload = multer({ storage });

router.post("/upload", upload.single("file"), filesController.handleUpload);

module.exports = router;
