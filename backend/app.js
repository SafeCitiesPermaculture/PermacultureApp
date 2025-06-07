const express = require("express");
const mongoose = require("mongoose");
const authRoutes = require("./routes/auth");
const adminRoutes = require("./routes/admin");
const listingRoutes = require("./routes/listings");
const messageRoutes = require("./routes/messages");
const reportRoutes = require("./routes/report");
const filesRoutes = require("./routes/files");
const Message = require("./models/Message");

const {
    userAuthMiddleware,
    adminAuthMiddleware,
} = require("./middleware/auth");
require("dotenv").config();

const app = express();
const PORT = 6000;
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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
app.use(userAuthMiddleware);
app.get("/api/protected", (req, res) => {
    res.json({ message: `Hello user "${req.user.username}"` });
});
app.use("/api/listings", listingRoutes);
app.use("/api", messageRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/files", filesRoutes);

//admin routes
app.use(adminAuthMiddleware);
app.use("/api/admin", adminRoutes);

// Create and start HTTP server with Socket.IO
const http = require("http");
const { Server } = require("socket.io");

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" }
});

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  // Join user-specific room
  socket.on("joinUserRoom", (userId) => {
    socket.join(userId);
    console.log(`Socket ${socket.id} joined user room: ${userId}`);
  });

  // Join conversation room
  socket.on("joinConversation", (conversationId) => {
    socket.join(conversationId);
    console.log(`Socket ${socket.id} joined conversation room: ${conversationId}`);
  });

  // Send message to conversation AND notify user rooms
  socket.on("sendMessage", ({ conversationId, message }) => {
    console.log(`📨 Socket ${socket.id} sending to ${conversationId}:`, message);

    socket.to(conversationId).emit("receiveMessage", message);

    if (Array.isArray(message.participants)) {
      message.participants.forEach((userId) => {
        io.to(userId).emit("conversationUpdated", {
          conversationId,
          lastMessage: message.text,
          updatedAt: message.createdAt,
        });
        console.log(`📤 Sent conversationUpdated to user room: ${userId}`);
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
      console.log(`Marked message ${messageId} as delivered to user ${userId}`);
    } catch (err) {
      console.error("Failed to mark as delivered:", err);
    }
  });


  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});


server.listen(PORT, () => {
  console.log(`Server with Socket.IO running on port ${PORT}`);
});
