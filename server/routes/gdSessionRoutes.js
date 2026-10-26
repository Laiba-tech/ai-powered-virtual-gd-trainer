
const express = require("express");

const {
  createGDSession,
  getDashboardStats,
  completeGDSession,
} = require("../controllers/gdSessionController");

const protect = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/", protect, createGDSession);
router.get("/dashboard-stats", protect, getDashboardStats);
router.patch("/:sessionId/complete", protect, completeGDSession);

module.exports = router;
