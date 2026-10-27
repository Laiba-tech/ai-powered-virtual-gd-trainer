
const express = require("express");
const cors = require("cors");
require("dotenv").config();

const connectDB = require("./config/db");

// Import routes
const authRoutes = require("./routes/authRoutes");
const gdSessionRoutes = require("./routes/gdSessionRoutes");
const gdMessageRoutes = require("./routes/gdMessageRoutes");
const speakingRoutes = require("./routes/speakingRoutes");

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// API routes
app.use("/api/auth", authRoutes);
app.use("/api/gd-sessions", gdSessionRoutes);
app.use("/api/gd-sessions", gdMessageRoutes);
app.use("/api/speaking", speakingRoutes);

// Health check
app.get("/", (req, res) => {
  res.status(200).json({
    message: "Virtual GD Trainer API is running 🚀",
    modules: [
      "Authentication",
      "Group Discussion",
      "Public Speaking",
    ],
  });
});

// Handle unknown routes
app.use((req, res) => {
  res.status(404).json({
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
});

// Connect to MongoDB and start server
const startServer = async () => {
  try {
    await connectDB();

    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
      console.log("Authentication routes: /api/auth");
      console.log("Group Discussion routes: /api/gd-sessions");
      console.log("Public Speaking routes: /api/speaking");
    });
  } catch (error) {
    console.error("Failed to start server:", error.message);
    process.exit(1);
  }
};

startServer();
