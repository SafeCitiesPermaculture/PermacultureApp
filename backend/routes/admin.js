const express = require("express");
const router = express.Router();
const adminController = require("../controllers/adminController");
const taskController = require("../controllers/taskController");

//define admin routes
router.get("/unverified", adminController.getUnverifiedUsers);
router.get("/verified", adminController.getVerifiedUsers);
router.get("/user/:id", adminController.getUser);
router.put("/verify/:id", adminController.verifyUser);
router.put("/remove/:id", adminController.removeUserById);
router.put("/user/update/:id", adminController.updateUser);
router.put("/user/reset-password/:id", adminController.resetUserPassword);
router.delete("/denyverify/:id", adminController.denyVerification);
router.get("/safecities", adminController.getSafeCitiesWorkers);

//admin task visibility: view tasks assigned to users + their completion details
router.get("/tasks", taskController.getAllTasks);

//example route
router.get("/admintest", (req, res) => {
    res.json({ message: `Hello admin "${req.user.username}"` });
});

module.exports = router;
