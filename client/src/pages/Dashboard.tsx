
import { useNavigate } from "react-router-dom";

function Dashboard() {
  const navigate = useNavigate();

  const userData = localStorage.getItem("user");
  const user = userData ? JSON.parse(userData) : null;

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
          Ready for your next practice session?
        </h1>

        <p className="mt-4 max-w-2xl text-slate-400">
          Improve your communication, practice group discussions,
          develop public speaking skills, and track your performance
          over time.
        </p>

        {/* Existing dashboard statistics */}
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-slate-900 p-6">
            <p className="text-sm text-slate-500">
              Sessions Completed
            </p>
            <p className="mt-3 text-4xl font-bold">0</p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-slate-900 p-6">
            <p className="text-sm text-slate-500">
              Average Score
            </p>
            <p className="mt-3 text-4xl font-bold">—</p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-slate-900 p-6">
            <p className="text-sm text-slate-500">
              Practice Streak
            </p>
            <p className="mt-3 text-4xl font-bold">0 days</p>
          </div>
        </div>

        {/* Existing GD section - preserved */}
        <div className="mt-10 rounded-2xl border border-white/10 bg-slate-900 p-8">
          <div className="mb-4 text-3xl">👥</div>

          <h2 className="text-2xl font-semibold">
            Group Discussion Practice
          </h2>

          <p className="mt-3 text-slate-400">
            Choose a topic and enter a virtual Group Discussion
            with AI participants. Practice teamwork, critical
            thinking, and expressing your opinions.
          </p>

          <button
            onClick={() => navigate("/gd-setup")}
            className="mt-6 rounded-xl bg-white px-6 py-3 font-semibold text-slate-950 transition hover:bg-slate-200"
          >
            Start GD →
          </button>
        </div>

        {/* New Public Speaking section */}
        <div className="mt-6 rounded-2xl border border-violet-400/20 bg-gradient-to-br from-violet-950/50 to-slate-900 p-8">
          <div className="mb-4 text-3xl">🎤</div>

          <h2 className="text-2xl font-semibold">
            Public Speaking Practice
          </h2>

          <p className="mt-3 max-w-2xl text-slate-400">
            Practice individual speeches on different topics,
            record your speech, review your transcript, and
            receive AI-powered feedback to improve your clarity,
            fluency, vocabulary, and speaking confidence.
          </p>

          <div className="mt-6 flex flex-wrap gap-4">
            <button
              onClick={() => navigate("/speaking/topics")}
              className="rounded-xl bg-violet-500 px-6 py-3 font-semibold text-white transition hover:bg-violet-400"
            >
              Start Speaking Practice →
            </button>

            <button
              onClick={() => navigate("/speaking/history")}
              className="rounded-xl border border-white/15 px-6 py-3 font-semibold text-white transition hover:bg-white/10"
            >
              View Speech History
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}

export default Dashboard;
