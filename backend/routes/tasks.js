const express = require("express");
const router = express.Router();
const taskController = require("../controllers/taskController");

router.post("/", taskController.createTask);
router.get("/", taskController.getTasks);
router.put("/complete/:id", taskController.markCompleted);
router.get("/completed", taskController.getCompletedTasks);
router.put("/incomplete/:id", taskController.markIncomplete);

module.exports = router;