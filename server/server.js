const express = require("express");
const cors = require("cors");
require("dotenv").config();

const connectDB = require("./config/db");
const authRoutes = require("./routes/authRoutes");
const gdSessionRoutes = require("./routes/gdSessionRoutes");
const gdMessageRoutes = require("./routes/gdMessageRoutes");

const app = express();

const PORT = process.env.PORT || 5000;

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

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});