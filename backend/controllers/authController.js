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

const checkUsernameEmailAvailable = async (username, email) => {
    try {
        const usernameTaken = await User.findOne({ username });
        const emailTaken = await User.findOne({ email });

        return {
            usernameTaken: !!usernameTaken,
            emailTaken: !!emailTaken
        };
    } catch (err) {
        res.status(500);
    }
};


/**
 * Signup handler
 */
const handleSignup = async (req, res) => {
    const { username, email, password } = req.body;
    try {
        const availabilityCheck = await checkUsernameEmailAvailable(username, email);
        if (availabilityCheck.usernameTaken && availabilityCheck.emailTaken) {
            return res.status(409).json({ message: "Username and email already taken" });
        } else if (availabilityCheck.usernameTaken) {
            return res.status(409).json({ message: "Username already taken" });
        } else if (availabilityCheck.emailTaken) {
            return res.status(409).json({ message: "Email already taken" }); 
        }

        const user = User({ username, email, password });
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

        if (!user.isVerified) {
            return res.status(403).json({ message: "You are still pending approval from an admin. Try again later!" });
        }

        if (user.isRemoved) {
            return res.status(403).json({ message: "Your account has been removed. Contact safecitiespermaculture@gmail.com for more information." });
        }

        const accessToken = generateAccessToken(user);
        const refreshToken = generateRefreshToken(user);

        await new Token({ userId: user._id, token: refreshToken }).save();

        res.json({ accessToken, refreshToken, user });
    } catch (err) {
        res.status(500).json({ error: `Server error. ${err}` });
    }
};

/**
 * Allow user to refresh their access token
 */
const handleRefresh = async (req, res) => {
    const { refreshToken } = req.body;
    if (!refreshToken) return res.sendStatus(401);

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

//gets the users data for refresh purposes
const refreshUserData = async (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).json({ message: "No token provided" });
    }

    const token = authHeader.split(" ")[1];
    try {
        const payload = jwt.verify(token, ACCESS_TOKEN_SECRET);
        const user = await User.findById(payload.userId);
        res.json({ user });
    } catch (err) {
        console.log(err);
        return res.status(401).json({ message: "Invalid token" });
    }
};

module.exports = {
    handleLogin,
    handleSignup,
    handleRefresh,
    handleLogout,
    refreshUserData,
};
