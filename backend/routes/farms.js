const express = require("express");
const router = express.Router();
const farmController = require("../controllers/farmController");
const { adminAuthMiddleware } = require("../middleware/auth");

// Any authenticated user can read the farm list (used for self-selection).
router.get("/", farmController.getFarms);

// Mutations are admin-only.
router.post("/", adminAuthMiddleware, farmController.createFarm);
router.put("/:id", adminAuthMiddleware, farmController.updateFarm);
router.delete("/:id", adminAuthMiddleware, farmController.deleteFarm);

module.exports = router;
