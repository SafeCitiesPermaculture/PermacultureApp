const User = require("../models/User");

//lists all users that have not been verified
const getUnverifiedUsers = async (req, res) => {
    try {
        const unverifiedUsers = await User.find({ isVerified: false });
        res.json(unverifiedUsers);
    } catch (err) {
        res.status(500).json({ message: "Server error" });
    }
};

//verify a user
const verifyUser = async (req, res) => {
    try {
        const { id } = req.params;
        const targetUser = await User.findById(id);

        if (!targetUser) {
            return res.status(404).json({ message: "User not found" });
        }

        targetUser.isVerified = true;
        await targetUser.save();

        res.json({ message: "User verified successfully", user: targetUser });
    } catch (err) {
        res.status(500).json({ message: "Server error" });
    }
};

//deny verification of a user
const denyVerification = async (req, res) => {
    try {
        const { id } = req.params;
        await User.findByIdAndDelete(id);

        res.json({ message: "user deleted successfully" });
    } catch (err) {
        res.status(500).json({ message: "Server error" });
    }
};

//mark user as removed
const markRemoved = async (req, res) => {
    try {
        if (req.user.userRole !== 'admin'){
            return res.status(401).json({ message: "Unauthorized: Only admins can remove users" });
        }

        const { id } = req.params;
        const targetUser = await User.findById(id);

        if (!targetUser) {
            return res.status(404).json({ message: `Could not find user ${username}`});
        }

        targetUser.isRemoved = true;
        targetUser.removedDate = new Date();
        await targetUser.save();

        res.status(200).json({ message: "User sucessfully removed" });
    } catch (error) {
        console.error("Error in markRemoved:", error);
        res.status(500).json({ message: "Error removing user", error: error.message });
    }
};

module.exports = { getUnverifiedUsers, verifyUser, denyVerification, markRemoved };
