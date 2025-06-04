const express = require("express");
const router = express.Router();
const reportController = require("../controllers/reportController");

router.post("/", reportController.makeReport);
router.get("/", reportController.getAllReports);
router.get("/:reportId", reportController.getReport);
router.delete("/:reportId", reportController.deleteReport);

module.exports = router;