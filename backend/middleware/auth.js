const jwt = require("jsonwebtoken");
const User = require("../models/User");
const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET;

//checks if a user is signed in
const userAuthMiddleware = async (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).json({ error: "No token provided" });
    }

    const token = authHeader.split(" ")[1];
    try {
        const payload = jwt.verify(token, ACCESS_TOKEN_SECRET);
        const userObj = await User.findById(payload.userId);
        req.user = userObj;
        next();
    } catch (err) {
        return res.status(401).json({ error: "Invalid token" });
    }
};

//checks if a signed in user is an admin
const adminAuthMiddleware = async (req, res, next) => {
    try {
        const user = req.user;
        if (user.userRole == "admin") {
            next();
        } else {
            return res.status(403).json({ error: "Not an admin" });
        }
    } catch (err) {
        return res.status(403).json({ error: "Not an admin" });
    }
};

module.exports = { userAuthMiddleware, adminAuthMiddleware };
