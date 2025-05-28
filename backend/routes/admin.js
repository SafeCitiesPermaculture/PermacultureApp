const express = require("express");
const router = express.Router();
const adminController = require("../controllers/adminController");

//define admin routes
router.post("/unverified", adminController.getUnverifiedUsers);
router.put("/verify/:id", adminController.verifyUser);
router.delete("/denyverify/:id", adminController.denyVerification);

//example route
router.get("/admintest", (req, res) => {
    res.json({ message: `Hello admin "${req.user.username}"` });
});

module.exports = router;
