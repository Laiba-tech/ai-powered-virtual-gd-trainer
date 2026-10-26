
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

interface DashboardStats {
  sessionsCompleted: number;
  averageScore: number | null;
  practiceStreak: number;
}

function Dashboard() {
  const navigate = useNavigate();

  const [stats, setStats] = useState<DashboardStats>({
    sessionsCompleted: 0,
    averageScore: null,
    practiceStreak: 0,
  });

  const [statsLoading, setStatsLoading] = useState(true);

  const userData = localStorage.getItem("user");
  let user = null;

  try {
    user = userData ? JSON.parse(userData) : null;
  } catch (error) {
    console.error("Error parsing user data:", error);
  }

  useEffect(() => {
    const fetchDashboardStats = async () => {
      const token = localStorage.getItem("token");

      if (!token) {
        setStatsLoading(false);
        navigate("/login");
        return;
      }

      try {
        const response = await fetch(
          "http://localhost:5000/api/gd-sessions/dashboard-stats",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (response.status === 401 || response.status === 403) {
          navigate("/login");
          return;
        }

        if (!response.ok) {
          throw new Error("Failed to fetch dashboard statistics.");
        }

        const data: DashboardStats = await response.json();
        setStats(data);
      } catch (error) {
        console.error("Dashboard stats error:", error);
      } finally {
        setStatsLoading(false);
      }
    };

    fetchDashboardStats();
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <nav className="border-b border-white/10">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <button
            onClick={() => navigate("/")}
            className="text-xl font-bold tracking-tight"
          >
            Virtual GD Trainer
          </button>

          <div className="flex items-center gap-6">
            {user && (
              <span className="text-sm text-slate-400">
                Hi, {user.name}
              </span>
            )}

            <button
              onClick={handleLogout}
              className="text-sm text-slate-400 transition hover:text-white"
            >
              Logout
            </button>
          </div>
        </div>
      </nav>

      <main className="mx-auto max-w-7xl px-6 py-16">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
          Dashboard
        </p>

        <h1 className="mt-3 text-4xl font-bold">
          Ready for your next GD?
        </h1>

        <p className="mt-4 max-w-2xl text-slate-400">
          Start a practice session, improve your communication, and track your
          performance over time.
        </p>

        <div className="mt-10 grid gap-6 md:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-slate-900 p-6">
            <p className="text-sm text-slate-500">Sessions Completed</p>
            <p className="mt-3 text-4xl font-bold">
              {statsLoading ? "..." : stats.sessionsCompleted}
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-slate-900 p-6">
            <p className="text-sm text-slate-500">Average Score</p>
            <p className="mt-3 text-4xl font-bold">
              {statsLoading
                ? "..."
                : stats.averageScore !== null
                  ? stats.averageScore
                  : "—"}
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-slate-900 p-6">
            <p className="text-sm text-slate-500">Practice Streak</p>
            <p className="mt-3 text-4xl font-bold">
              {statsLoading ? "..." : `${stats.practiceStreak} days`}
            </p>
          </div>
        </div>

        <div className="mt-10 rounded-2xl border border-white/10 bg-slate-900 p-8">
          <h2 className="text-2xl font-semibold">
            Start your next practice session
          </h2>

          <p className="mt-3 text-slate-400">
            Choose a topic and enter a virtual Group Discussion with AI
            participants.
          </p>

          <button
            onClick={() => navigate("/gd-setup")}
            className="mt-6 rounded-xl bg-white px-6 py-3 font-semibold text-slate-950 transition hover:bg-slate-200"
          >
            Start GD →
          </button>
        </div>
      </main>
    </div>
  );
}

export default Dashboard;
