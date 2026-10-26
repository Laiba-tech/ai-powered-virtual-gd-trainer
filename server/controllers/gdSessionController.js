
const GDSession = require("../models/GDSession");

// CREATE GD SESSION
const createGDSession = async (req, res) => {
  try {
    const { topic, difficulty, duration } = req.body;

    if (!topic || !difficulty || !duration) {
      return res.status(400).json({
        message: "Please provide topic, difficulty and duration.",
      });
    }

    const session = await GDSession.create({
      userId: req.userId,
      topic,
      difficulty,
      duration,
    });

    res.status(201).json({
      message: "GD session created successfully.",
      session,
    });
  } catch (error) {
    console.error("Create GD session error:", error);

    res.status(500).json({
      message: "Server error while creating GD session.",
    });
  }
};

const completeGDSession = async (req, res) => {
  try {
    const { sessionId } = req.params;

    let session = await GDSession.findOneAndUpdate(
      {
        _id: sessionId,
        userId: req.userId,
        status: { $ne: "completed" },
      },
      {
        $set: {
          status: "completed",
          endedAt: new Date(),
        },
      },
      { new: true }
    );

    if (!session) {
      session = await GDSession.findById(sessionId);
    }

    if (!session) {
      return res.status(404).json({
        message: "GD session not found.",
      });
    }

    if (session.userId.toString() !== req.userId.toString()) {
      return res.status(403).json({
        message: "You are not authorized to access this session.",
      });
    }

    if (session.status !== "completed") {
      return res.status(409).json({
        message: "GD session could not be completed. Please try again.",
      });
    }

    res.status(200).json({
      message: "GD session completed successfully.",
      session,
    });
  } catch (error) {
    console.error("Complete GD session error:", error);

    res.status(500).json({
      message: "Server error while completing GD session.",
    });
  }
};

// GET DASHBOARD STATISTICS
const getDashboardStats = async (req, res) => {
  try {
    const sessions = await GDSession.find({
      userId: req.userId,
    }).sort({ createdAt: -1 });

    const completedSessions = sessions.filter(
      (session) => session.status === "completed"
    );

    // Calculate consecutive practice days
    const practiceDates = [
      ...new Set(
        completedSessions.map((session) =>
          new Date(session.createdAt).toISOString().slice(0, 10)
        )
      ),
    ].sort((a, b) => b.localeCompare(a));

    let practiceStreak = 0;

    if (practiceDates.length > 0) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      const latestDate = new Date(`${practiceDates[0]}T00:00:00`);

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

          practiceStreak++;
          expectedDate.setDate(expectedDate.getDate() - 1);
        }
      }
    }

    res.status(200).json({
      sessionsCompleted: completedSessions.length,
      averageScore: null,
      practiceStreak,
    });
  } catch (error) {
    console.error("Get dashboard stats error:", error);

    res.status(500).json({
      message: "Server error while fetching dashboard statistics.",
    });
  }
};

module.exports = {
  createGDSession,
  getDashboardStats,
  completeGDSession,
};
