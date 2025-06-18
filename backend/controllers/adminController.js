const User = require("../models/User");
const transporter = require("../utils/transporter");
require("dotenv").config();

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

        try {
            await transporter.sendMail({
                from: `"AFC Estate App" <${process.env.EMAIL_USERNAME}>`,
                to: targetUser.email,
                subject: "AFC Estate Account Status",
                html: `
                <p>Hello,</p>
                <p>There have been changes to your AFC Estate Account</p>
                <p>Your account has been <strong>approved</strong>.</p>
                <p>Go to afc-estate.vercel.app to login or download the app from the Google Play store.</p>
                <p>Thank you,</p>
                <p>Safe Cities Team</p>`
            });
        } catch (emailError) {
            console.log("Failed to send verification email");
        }

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

        const user =  await User.findByIdAndDelete(id);

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        try {
            await transporter.sendMail({
                from: `"AFC Estate App" <${process.env.EMAIL_USERNAME}>`,
                to: user.email,
                subject: "AFC Estate Account Status",
                html: `
                <p>Hello,</p>
                <p>There have been changes to your AFC Estate Account</p>
                <p>Your account has been <strong>denied</strong>.</p>
                <p>Go to afc-estate.vercel.app to sign up again or contact us at safecitiespermaculture@gmail.com</p>
                <p>Thank you,</p>
                <p>Safe Cities Team</p>`
            });
        } catch (emailError) {
            console.log("Failed to send verification email");
        }

        res.status(200).json({ message: "user deleted successfully" });
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
