const jwt = require("jsonwebtoken");
const User = require("../models/User");
require("dotenv").config();
const JWT_SECRET = process.env.JWT_SECRET;

/**
 * Signup handler
 */
const handleSignup = async (req, res) => {
    const { username, password } = req.body;
    try {
        const user = User({ username, password });
        await user.save();
        res.status(201).json({ message: "User created" });
    } catch (err) {
        res.status(400).json({
            error: `Username might be taken or data invalid. Full Error: ${err}`,
        });
    }
};

/**
 * Login handler
 */

const handleLogin = async (req, res) => {
    const { username, password } = req.body;
    try {
        const user = await User.findOne({ username });
        if (!user || !(await user.comparePassword(password))) {
            return res.status(401).json({ error: "Invalid credentials" });
        }

        const token = jwt.sign({ userId: user._id }, JWT_SECRET, {
            expiresIn: "1d",
        });
        res.json({ token });
    } catch (err) {
        res.status(500).json({ error: `Server error. ${err}` });
    }
};

module.exports = { handleLogin, handleSignup };
