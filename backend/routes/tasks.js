const express = require("express");
const router = express.Router();
const multer = require("multer");
const taskController = require("../controllers/taskController");

// In-memory storage so completion photos can be streamed to Google Drive.
// No format restriction (any image type is allowed); 25MB cap so oversized
// originals fail cleanly instead of hanging.
const storage = multer.memoryStorage();
const upload = multer({ storage, limits: { fileSize: 25 * 1024 * 1024 } });

router.post("/", taskController.createTask);
router.get("/", taskController.getTasks);
router.put("/complete/:id", upload.single("photo"), taskController.markCompleted);
router.get("/completed", taskController.getCompletedTasks);
router.put("/incomplete/:id", taskController.markIncomplete);
router.delete("/:id", taskController.deleteTask)

module.exports = router;
