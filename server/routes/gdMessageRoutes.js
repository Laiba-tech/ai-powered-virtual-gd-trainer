const express = require("express");

const {
  addGDMessage,
  getGDMessages,
  generateAIMessage,
} = require("../controllers/gdMessageController");

const protect = require("../middleware/authMiddleware");

const router = express.Router();

// Add message to a GD session
router.post("/:sessionId/messages", protect, addGDMessage);

// Get all messages of a GD session
router.get("/:sessionId/messages", protect, getGDMessages);

// Generate AI participant response
router.post(
  "/:sessionId/ai-response",
  protect,
  generateAIMessage
);

module.exports = router;