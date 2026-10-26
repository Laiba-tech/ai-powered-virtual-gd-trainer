
const express = require("express");
const protect = require("../middleware/authMiddleware");

const {
  getTopics,
  createSession,
  evaluateSession,
  getHistory,
  getSession,
  getAudienceReaction,
} = require("../controllers/speakingController");

const router = express.Router();

// Protect speaking routes with existing authentication middleware
router.use(protect);

// Test endpoint
router.get("/test", (req, res) => {
  res.json({
    message: "Speaking routes are working!",
  });
});

// Existing speaking routes — preserved
router.get("/topics", getTopics);
router.post("/sessions", createSession);
router.get("/sessions", getHistory);
router.get("/sessions/:id", getSession);
router.post("/sessions/:id/evaluate", evaluateSession);
router.post("/sessions/:id/audience", getAudienceReaction);
router.post("/hint", getHint);

module.exports = router;
