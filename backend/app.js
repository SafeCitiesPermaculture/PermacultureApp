const express = require("express");
const mongoose = require("mongoose");
const authRoutes = require("./routes/auth");
const authMiddleware = require("./middleware/auth");
require("dotenv").config();

const app = express();
const PORT = 6000;
app.use(express.json());

app.use((req, res, next) => {
    console.log(`${req.method} ${req.url}`);
    next();
});

//connect to mongodb
mongoose
    .connect(process.env.MONGODB_URI)
    .then(() => console.log("Connected to MongoDB"))
    .catch((err) => console.error("MongoDB error", err));

//routes
app.use("/api/auth", authRoutes);

//Protected routes
app.use(authMiddleware);
app.get("/api/protected", (req, res) => {
    res.json({ message: `Hello user ${req.user.userId}` });
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
