
const GDSession = require("../models/GDSession");

const createGDSession = async (req, res) => {
  try {
    const { topic, difficulty, duration } = req.body;

    if (!topic || !topic.trim()) {
      return res.status(400).json({
        message: "Topic is required.",
      });
    }

    const durationMinutes = Number(duration);
    if (!Number.isFinite(durationMinutes) || durationMinutes < 1 || durationMinutes > 60) {
      return res.status(400).json({
        message: "Duration must be a number between 1 and 60 minutes.",
      });
    }

    const session = await GDSession.create({
      userId: req.userId,
      topic: topic.trim(),
      difficulty: difficulty || "Intermediate",
      duration: durationMinutes,
      status: "created",
      startedAt: new Date(),
    });

    return res.status(201).json({
      message: "GD session created successfully.",
      session,
    });
  } catch (error) {
    console.error("Create GD session error:", error);
    return res.status(500).json({
      message: "Server error while creating GD session.",
    });
  }
};

const getDashboardStats = async (req, res) => {
  try {
    const sessions = await GDSession.find({
      userId: req.userId,
    }).sort({ createdAt: -1 });

    const completedSessions = sessions.filter(
      (session) => session.status === "completed"
    );

    const practiceDates = [
      ...new Set(
        completedSessions.map((session) => {
          const date = new Date(session.createdAt);
          date.setHours(0, 0, 0, 0);
          return date.toISOString().slice(0, 10);
        })
      ),
    ].sort((a, b) => b.localeCompare(a));

    let practiceStreak = 0;

    if (practiceDates.length > 0) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const latestDate = new Date(`${practiceDates[0]}T00:00:00`);
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      if (
        latestDate.getTime() === today.getTime() ||
        latestDate.getTime() === yesterday.getTime()
      ) {
        let expectedDate = new Date(latestDate);

        for (const date of practiceDates) {
          const currentDate = new Date(`${date}T00:00:00`);

          if (currentDate.getTime() !== expectedDate.getTime()) {
            break;
          }

          practiceStreak += 1;
          expectedDate.setDate(expectedDate.getDate() - 1);
        }
      }
    }

    return res.status(200).json({
      sessionsCompleted: completedSessions.length,
      averageScore: null,
      practiceStreak,
    });
  } catch (error) {
    console.error("Get dashboard stats error:", error);

    return res.status(500).json({
      message: "Server error while fetching dashboard statistics.",
    });
  }
};

const completeGDSession = async (req, res) => {
  try {
    const { sessionId } = req.params;

    const session = await GDSession.findOne({
      _id: sessionId,
      userId: req.userId,
    });

    if (!session) {
      return res.status(404).json({
        message: "GD session not found.",
      });
    }

    if (session.status === "completed") {
      return res.status(200).json({
        message: "GD session is already complete.",
        session,
      });
    }

    session.status = "completed";
    session.endedAt = new Date();
    await session.save();

    return res.status(200).json({
      message: "GD session completed successfully.",
      session,
    });
  } catch (error) {
    console.error("Complete GD session error:", error);
    return res.status(500).json({
      message: "Server error while completing GD session.",
    });
  }
};

module.exports = {
  createGDSession,
  getDashboardStats,
  completeGDSession,
};
