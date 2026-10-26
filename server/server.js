
const express = require("express");
const cors = require("cors");
require("dotenv").config();

const connectDB = require("./config/db");
const authRoutes = require("./routes/authRoutes");
const gdSessionRoutes = require("./routes/gdSessionRoutes");
const gdMessageRoutes = require("./routes/gdMessageRoutes");
const speakingRoutes = require("./routes/speakingRoutes");

const app = express();

const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Authentication routes
app.use("/api/auth", authRoutes);

// Existing Group Discussion routes
app.use("/api/gd-sessions", gdSessionRoutes);
app.use("/api/gd-sessions", gdMessageRoutes);

// Public Speaking routes
app.use("/api/speaking", speakingRoutes);

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors());
app.use(express.json());
//Routes
app.use("/api/auth", authRoutes);
app.use("/api/gd-sessions", gdSessionRoutes);
app.use("/api/gd-sessions", gdMessageRoutes);

// Test route
app.get("/", (req, res) => {
  res.json({
    message: "Virtual GD Trainer API is running 🚀",
  });
});

// Connect to MongoDB and start the server
const startServer = async () => {
  try {
    await connectDB();

    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error.message);
    process.exit(1);
  }
};

startServer();
// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
