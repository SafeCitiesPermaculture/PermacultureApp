const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Token = require("../models/Token");
require("dotenv").config();
const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET;
const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET;

//Helper functions
const generateAccessToken = (user) => {
    return jwt.sign({ userId: user._id }, ACCESS_TOKEN_SECRET, {
        expiresIn: "15m",
    });
};

const generateRefreshToken = (user) => {
    return jwt.sign({ userId: user._id }, REFRESH_TOKEN_SECRET, {
        expiresIn: "7d",
    });
};

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

        const accessToken = generateAccessToken(user);
        const refreshToken = generateRefreshToken(user);

        await new Token({ userId: user._id, token: refreshToken }).save();

        res.json({ accessToken, refreshToken });
    } catch (err) {
        res.status(500).json({ error: `Server error. ${err}` });
    }
};

/**
 * Allow user to refresh their access token
 */
const handleRefresh = async (req, res) => {
    const { refreshToken } = req.body;
    if (!refreshToken) return res.sendStaus(401);

    const storedToken = await Token.findOne({ token: refreshToken });
    if (!storedToken) return res.sendStatus(403);

    jwt.verify(refreshToken, REFRESH_TOKEN_SECRET, async (err, decoded) => {
        if (err) return res.sendStatus(403);

        const userId = decoded.userId;
        const accessToken = generateAccessToken({ _id: userId });

        res.json({ accessToken });
    });
};

/**
 * Allows user to logout
 */
const handleLogout = async (req, res) => {
    const { refreshToken } = req.body;
    await Token.deleteOne({ token: refreshToken });
    res.sendStatus(204);
};

module.exports = { handleLogin, handleSignup, handleRefresh, handleLogout };
