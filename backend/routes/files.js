const express = require("express");
const router = express.Router();
const filesController = require("../controllers/filesController");
const multer = require("multer");

//configure local storage
const storage = multer.memoryStorage();
const upload = multer({ storage });

router.post("/upload", upload.single("file"), filesController.handleUpload);
router.get("/list", filesController.listFiles);
router.post("/:id", filesController.getFileById);
router.delete("/delete/:id", filesController.deleteFile);
router.post("/folder/create", filesController.createFolder);

module.exports = router;
