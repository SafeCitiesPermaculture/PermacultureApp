const express = require("express");
const router = express.Router();
const adminController = require("../controllers/adminController");

//define admin routes
router.get("/unverified", adminController.getUnverifiedUsers);
router.get("/verified", adminController.getVerifiedUsers);
router.get("/user/:id", adminController.getUser);
router.put("/verify/:id", adminController.verifyUser);
router.put("/removeid/:id", adminController.removeUserById);
router.put("/user/update/:id", adminController.updateUser);
router.delete("/denyverify/:id", adminController.denyVerification);
router.put("/remove/:id", adminController.markRemoved);

//example route
router.get("/admintest", (req, res) => {
    res.json({ message: `Hello admin "${req.user.username}"` });
});

module.exports = router;
