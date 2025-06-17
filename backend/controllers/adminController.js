const User = require("../models/User");

//lists all users that have not been verified
const getUnverifiedUsers = async (req, res) => {
    try {
        const unverifiedUsers = await User.find({
            isVerified: false,
            isRemoved: false,
        });
        res.json(unverifiedUsers);
    } catch (err) {
        res.status(500).json({ message: "Server error" });
    }
};

//return all users that have been verified
const getVerifiedUsers = async (req, res) => {
    try {
        const verifiedUsers = await User.find({
            isVerified: true,
            isRemoved: false,
        });
        res.json(verifiedUsers);
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

//returns a single user
const getUser = async (req, res) => {
    try {
        const { id } = req.params;
        const foundUser = await User.findById(id);
        if (foundUser) {
            res.json(foundUser);
        } else {
            res.status(400).json({ message: "User not found" });
        }
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

//remove a user
const removeUserById = async (req, res) => {
    try {
        const { id } = req.params;
        const targetUser = await User.findById(id);

        if (!targetUser) {
            return res.status(404).json({ message: "User not found" });
        }

        targetUser.isRemoved = true;
        res.json({ message: "User removed successfully" });
        await targetUser.save();
    } catch (err) {
        res.status(500).json({ message: "Server error" });
    }
};

//fully update a user
const updateUser = async (req, res) => {
    try {
        const { updatedUserData } = req.body;
        const { id } = req.params;

        //mongo does NOT like when you change the _id field
        delete updatedUserData._id;

        const updatedUser = await User.findByIdAndUpdate(id, updatedUserData, {
            new: true,
            runValidators: true,
        });

        if (!updatedUser) {
            return res.status(404).json({ error: "Item not found" });
        }

        res.json(updatedUser);
    } catch (err) {
        res.status(500).json({ message: "Server error" });
    }
};

const getSafeCitiesWorkers = async (req, res) => {
    try {
        const safeCitiesWorkers = await User.find({ isSafeCities: true });
        return res.status(201).json({ message: "Fetched safe cities workers", safeCitiesWorkers });
    } catch (err) {
        res.status(500).json({ message: "Server error while fetching safe cities workers" });
    }
}

module.exports = {
    getUnverifiedUsers,
    getVerifiedUsers,
    getUser,
    verifyUser,
    denyVerification,
    removeUserById,
    updateUser,
    getSafeCitiesWorkers,
};
