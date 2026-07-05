const express = require("express");
const router = express.Router();
const chatController = require("../controllers/chatController");

router.get("/", chatController.getChats);
router.post("/save", chatController.saveChat);
router.get("/:id", chatController.getChat);
router.put("/:id/pin", chatController.togglePin);
router.put("/:id/rename", chatController.renameChat);
router.delete("/:id", chatController.deleteChat);

module.exports = router;
