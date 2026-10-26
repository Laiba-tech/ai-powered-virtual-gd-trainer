import { useState } from "react";
import { useNavigate } from "react-router-dom";

function GDSetup() {
  const navigate = useNavigate();

  const [topic, setTopic] = useState("");
  const [difficulty, setDifficulty] = useState("Intermediate");
  const [duration, setDuration] = useState("10");
  const [loading, setLoading] = useState(false);
const [error, setError] = useState("");

  const topics = [
    "AI in Education",
    "Impact of AI on Jobs",
    "Social Media: Boon or Bane",
    "Work From Home vs Office",
    "Climate Change",
  ];

  const handleStart = async () => {
  if (!topic) {
    return;
  }

  try {
    setLoading(true);
    setError("");

    const token = localStorage.getItem("token");

    if (!token) {
      navigate("/login");
      return;
    }

    const response = await fetch(
      "http://localhost:5000/api/gd-sessions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          topic,
          difficulty,
          duration: Number(duration),
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      setError(data.message || "Unable to create GD session.");
      return;
    }

    console.log("GD Session Created:", data.session);

    navigate("/gd-room", {
      state: {
        session: data.session,
      },
    });
  } catch (error) {
    console.error("GD session error:", error);
    setError("Unable to connect to server. Please try again.");
  } finally {
    setLoading(false);
  }
};

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Navbar */}
      <nav className="border-b border-white/10">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <button
            onClick={() => navigate("/dashboard")}
            className="text-xl font-bold tracking-tight"
          >
            Virtual GD Trainer
          </button>

          <button
            onClick={() => navigate("/dashboard")}
            className="text-sm text-slate-400 transition hover:text-white"
          >
            Back to Dashboard
          </button>
        </div>
      </nav>

      {/* Main */}
      <main className="mx-auto max-w-3xl px-6 py-16">
        <div className="mb-10">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
            Practice Setup
          </p>

          <h1 className="mt-3 text-4xl font-bold">
            Set up your GD session
          </h1>

          <p className="mt-4 text-slate-400">
            Choose a topic, difficulty level, and session duration before
            entering the virtual discussion.
          </p>
        </div>

        <div className="space-y-8 rounded-2xl border border-white/10 bg-slate-900 p-8">
          {/* Topic */}
          <div>
            <label className="mb-3 block text-sm font-medium text-slate-300">
              Discussion Topic
            </label>

            <div className="grid gap-3">
              {topics.map((item) => (
                <button
                  key={item}
                  onClick={() => setTopic(item)}
                  className={`rounded-xl border px-5 py-4 text-left transition ${
                    topic === item
                      ? "border-white/40 bg-white/10 text-white"
                      : "border-white/10 bg-slate-950 text-slate-400 hover:border-white/20 hover:text-white"
                  }`}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>

          {/* Difficulty */}
          <div>
            <label className="mb-3 block text-sm font-medium text-slate-300">
              Difficulty
            </label>

            <div className="grid grid-cols-3 gap-3">
              {["Beginner", "Intermediate", "Advanced"].map((level) => (
                <button
                  key={level}
                  onClick={() => setDifficulty(level)}
                  className={`rounded-xl border px-4 py-3 text-sm font-medium transition ${
                    difficulty === level
                      ? "border-white/40 bg-white/10 text-white"
                      : "border-white/10 bg-slate-950 text-slate-400 hover:border-white/20 hover:text-white"
                  }`}
                >
                  {level}
                </button>
              ))}
            </div>
          </div>

          {/* Duration */}
          <div>
            <label className="mb-3 block text-sm font-medium text-slate-300">
              Duration
            </label>

            <div className="grid grid-cols-3 gap-3">
              {["5", "10", "15"].map((time) => (
                <button
                  key={time}
                  onClick={() => setDuration(time)}
                  className={`rounded-xl border px-4 py-3 text-sm font-medium transition ${
                    duration === time
                      ? "border-white/40 bg-white/10 text-white"
                      : "border-white/10 bg-slate-950 text-slate-400 hover:border-white/20 hover:text-white"
                  }`}
                >
                  {time} min
                </button>
              ))}
            </div>
          </div>

          {/* Summary */}
          <div className="rounded-xl border border-white/10 bg-slate-950 p-5">
            <p className="text-sm text-slate-500">Session Summary</p>

            <div className="mt-4 grid gap-4 sm:grid-cols-3">
              <div>
                <p className="text-xs text-slate-600">Topic</p>
                <p className="mt-1 text-sm text-slate-300">
                  {topic || "Not selected"}
                </p>
              </div>

              <div>
                <p className="text-xs text-slate-600">Difficulty</p>
                <p className="mt-1 text-sm text-slate-300">
                  {difficulty}
                </p>
              </div>

              <div>
                <p className="text-xs text-slate-600">Duration</p>
                <p className="mt-1 text-sm text-slate-300">
                  {duration} minutes
                </p>
              </div>
            </div>
          </div>
{error && (
  <div className="rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
    {error}
  </div>
)}

          {/* Start */}
          <button
  onClick={handleStart}
  disabled={!topic || loading}
  className="w-full rounded-xl bg-white px-6 py-3.5 font-semibold text-slate-950 transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-40"
>
  {loading ? "Creating Session..." : "Enter Virtual GD →"}
</button>
        </div>
      </main>
    </div>
  );
}

export default GDSetup;