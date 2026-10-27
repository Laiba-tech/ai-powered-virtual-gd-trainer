import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

type Message = {
  _id: string;
  speaker: "user" | "ai";
  participant: "user" | "analytical" | "critical" | "supportive";
  text: string;
  timestamp: string;
};

function GDReport() {
  const location = useLocation();
  const navigate = useNavigate();

  const session = location.state?.session;

  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchMessages = async () => {
      if (!session?._id) {
        setLoading(false);
        return;
      }

      try {
        const token = localStorage.getItem("token");

        if (!token) {
          navigate("/login");
          return;
        }

        const response = await fetch(
          `http://localhost:5000/api/gd-sessions/${session._id}/messages`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const data = await response.json();

        if (!response.ok) {
          setError(data.message || "Failed to fetch session messages.");
          return;
        }

        setMessages(data.data);
      } catch (error) {
        console.error("Fetch messages error:", error);
        setError("Unable to load session messages.");
      } finally {
        setLoading(false);
      }
    };

    fetchMessages();
  }, [session, navigate]);

  if (!session) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 px-6 text-white">
        <div className="text-center">
          <h1 className="text-2xl font-bold">
            No GD session found.
          </h1>

          <button
            onClick={() => navigate("/gd-setup")}
            className="mt-6 rounded-xl bg-white px-6 py-3 font-semibold text-slate-950"
          >
            Start New GD
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="mx-auto max-w-5xl px-6 py-12">
        <h1 className="text-3xl font-bold">
          GD Performance Report
        </h1>

        <p className="mt-3 text-slate-400">
          Your session conversation and performance analysis.
        </p>

        <div className="mt-8 rounded-2xl border border-white/10 bg-slate-900 p-6">
          <p className="text-sm text-slate-500">
            Discussion Topic
          </p>

          <h2 className="mt-2 text-xl font-semibold">
            {session.topic}
          </h2>

          <div className="mt-4 flex gap-8 text-sm text-slate-400">
            <p>
              Difficulty: <span className="text-white">{session.difficulty}</span>
            </p>

            <p>
              Duration: <span className="text-white">{session.duration} minutes</span>
            </p>
          </div>
        </div>

        <div className="mt-8">
          <h2 className="text-xl font-semibold">
            Discussion Transcript
          </h2>

          {loading && (
            <p className="mt-4 text-slate-500">
              Loading conversation...
            </p>
          )}

          {error && (
            <p className="mt-4 text-red-400">
              {error}
            </p>
          )}

          {!loading && !error && messages.length === 0 && (
            <p className="mt-4 text-slate-500">
              No messages found for this session.
            </p>
          )}

          <div className="mt-5 space-y-4">
            {messages.map((message) => (
              <div
                key={message._id}
                className="rounded-xl border border-white/10 bg-slate-900 p-5"
              >
                <div className="flex items-center justify-between">
                  <p className="font-semibold">
                    {message.speaker === "user"
                      ? "You"
                      : `AI ? ${message.participant}`}
                  </p>

                  <span className="text-xs text-slate-500">
                    {new Date(message.timestamp).toLocaleTimeString()}
                  </span>
                </div>

                <p className="mt-3 leading-7 text-slate-300">
                  {message.text}
                </p>
              </div>
            ))}
          </div>
        </div>

        <button
          onClick={() => navigate("/dashboard")}
          className="mt-10 rounded-xl bg-white px-6 py-3 font-semibold text-slate-950"
        >
          Back to Dashboard
        </button>
      </div>
    </div>
  );
}

export default GDReport;
