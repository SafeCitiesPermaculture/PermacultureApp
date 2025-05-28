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

module.exports = { getUnverifiedUsers, verifyUser, denyVerification };
