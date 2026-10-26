
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

      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      const latestDate = new Date(`${practiceDates[0]}T00:00:00`);

      if (
        latestDate.getTime() === today.getTime() ||
        latestDate.getTime() === yesterday.getTime()
      ) {
        const expectedDate = new Date(latestDate);

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
