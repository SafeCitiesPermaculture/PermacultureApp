const express = require("express");
const mongoose = require("mongoose");
const path = require("path");
const cors = require("cors");

const authRoutes = require("./routes/auth");
const adminRoutes = require("./routes/admin");
const listingRoutes = require("./routes/listings");
const messageRoutes = require("./routes/messages");
const reportRoutes = require("./routes/report");
const filesRoutes = require("./routes/files");
const filesController = require("./controllers/filesController");
const userRoutes = require("./routes/user");
const Message = require("./models/Message");
const Conversation = require("./models/Conversation");
const taskRoutes = require("./routes/tasks");

const {
    userAuthMiddleware,
    adminAuthMiddleware,
} = require("./middleware/auth");
require("dotenv").config();

const app = express();
const PORT = 3000;
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use((req, res, next) => {
    console.log(`${req.method} ${req.url}`);
    next();
});

// Allow requests from frontend (adjust the origin as needed)
const allowedOrigins = [
    "http://localhost:8081",
    "https://sc-permaculture.vercel.app",
];

app.use(
    cors({
        origin: function (origin, callback) {
            if (!origin || allowedOrigins.includes(origin)) {
                callback(null, true);
            } else {
                callback(new Error("Not allowed by CORS"));
            }
        },
        credentials: true,
    })
);

//connect to mongodb
mongoose
    .connect(process.env.MONGODB_URI)
    .then(() => console.log("Connected to MongoDB"))
    .catch((err) => console.error("MongoDB error", err));

//serve the privacy policy page
app.get("/privacy-policy", (req, res) => {
    res.sendFile(path.join(__dirname, "index.html"));
});

//serve the contact page
app.get("/contact", (req, res) => {
    res.sendFile(path.join(__dirname, "contact.html"));
});

//unprotected file proxy route
app.get("/api/files/file-proxy", filesController.proxyGetFile);

//route to start the server
app.get("/api/start", (req, res) => {
    res.send("Server is running");
});

//routes
app.use("/api/auth", authRoutes);

//Protected routes
app.use(userAuthMiddleware);
app.get("/api/protected", (req, res) => {
    res.json({ message: `Hello user "${req.user.username}"` });
});
app.use("/api/listings", listingRoutes);
app.use("/api", messageRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/files", filesRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/user", userRoutes);

//admin routes
app.use(adminAuthMiddleware);
app.use("/api/admin", adminRoutes);

// Create and start HTTP server with Socket.IO
const http = require("http");
const { Server } = require("socket.io");

const server = http.createServer(app);
const io = new Server(server, {
    cors: { origin: "*" },
});

io.on("connection", (socket) => {
    // Join user-specific room
    socket.on("joinUserRoom", async (userId) => {
        socket.join(userId);
        try {
            const conversations = await Conversation.find({
                participants: userId,
            })
                .populate("participants", "username")
                .sort({ updatedAt: -1 });

            for (const convo of conversations) {
                const lastMessage = await Message.findOne({
                    conversation: convo._id,
                }).sort({ createdAt: -1 });

                io.to(userId).emit("conversationUpdated", {
                    conversationId: convo._id.toString(),
                    name: convo.name,
                    updatedAt: convo.updatedAt,
                    lastMessage: lastMessage?.text ?? "",
                });
            }
        } catch (err) {
            console.error("Failed to emit conversations on joinUserRoom:", err);
        }
    });

    // Join conversation room
    socket.on("joinConversation", (conversationId) => {
        socket.join(conversationId);
    });

    // Send message to conversation AND notify user rooms
    socket.on("sendMessage", async ({ conversationId, message }) => {
        socket.to(conversationId).emit("receiveMessage", message);

        const conversation = await Conversation.findById(conversationId);

        if (Array.isArray(message.participants)) {
            message.participants.forEach((userId) => {
                io.to(userId).emit("conversationUpdated", {
                    conversationId,
                    lastMessage: message.text,
                    updatedAt: message.createdAt,
                    name: conversation.name,
                });
            });
        } else {
            console.warn("⚠️ No participants array in message:", message);
        }
    });

    socket.on("messageDelivered", async ({ messageId, userId }) => {
        try {
            await Message.findByIdAndUpdate(messageId, {
                $addToSet: { deliveredTo: userId },
            });
        } catch (err) {
            console.error("Failed to mark as delivered:", err);
        }
    });

    socket.on("disconnect", () => {
        console.log("User disconnected:", socket.id);
    });
});

if (require.main === module) {
    server.listen(PORT, () => {
        console.log(`Server with Socket.IO running on port ${PORT}`);
    });
}
