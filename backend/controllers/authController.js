const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Token = require("../models/Token");
const nodemailer = require("nodemailer");
require("dotenv").config();
const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET;
const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET;

const devUrl = "http://localhost:8081"
const FRONTEND_URL = devUrl;

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

const sendResetPasswordEmail = async (req, res) => {
    const { username, email } = req.body;

    try {
        const user = await User.findOne({ username, email });
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        const resetToken = jwt.sign(
            { userId: user._id },
            process.env.RESET_PASSWORD_SECRET,
            { expiresIn: '15m' }
        );

        const resetURL = `${FRONTEND_URL}/reset-password/${resetToken}`;

        const transporter = nodemailer.createTransport({
            service: 'Gmail',
            auth: {
                user: process.env.EMAIL_USERNAME,
                pass: process.env.EMAIL_PASSWORD
            }
        });

        await transporter.sendMail({
            to: email,
            subject: "PASSWORD RESET: Safe Cities Permaculture App",
            html: 
                `<p>You requested a password reset for the Safe Cities Permaculture App.</p>
                <p>Click <a href="${resetURL}">here</a> to reset your password. This link expires in 15 minutes.</p>
                <p>If you did not request a password reset, <strong>DO NOT</strong> click this link.</p>
                <p>Remember to never share your password with anyone.</p>`
        });

        console.log("sent email to", email);

        return res.status(200).json({ message: "Reset password link sent to email" });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

const resetPasswordWithToken = async (req, res) => {
    const { token, newPassword } = req.body;

    try {
        const payload = jwt.verify(token, process.env.RESET_PASSWORD_SECRET);
        const user = User.findById(payload.userId);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        user.password = newPassword;
        await user.save();
        return res.status(201).json({ message: "Password reset" });
    } catch (error) {
        return res.status(400).json({ message: "Invalid or expired token" });
    }
};

module.exports = {
    handleLogin,
    handleSignup,
    handleRefresh,
    handleLogout,
    refreshUserData,
    sendResetPasswordEmail,
    resetPasswordWithToken,
};
