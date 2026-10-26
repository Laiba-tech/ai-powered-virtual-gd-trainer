
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { speakingService } from "../services/speakingService";

export default function SpeechHistory() {
  const [sessions, setSessions] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    speakingService.getHistory()
      .then((data) => {
        setSessions(data.sessions || []);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p>Loading practice history...</p>;

  return (
    <main className="speaking-page">
      <h1>My Speaking Progress</h1>

      {error && <p role="alert">{error}</p>}

      {!sessions.length && !error && (
        <p>You have no saved practice sessions yet.</p>
      )}

      {sessions.map((session) => (
        <article className="speaking-card" key={session._id}>
          <h2>{session.topic}</h2>
          <p>Difficulty: {session.difficulty}</p>
          <p>Score: {session.overallScore ?? "Not evaluated"}</p>
          <p>
            Date: {session.createdAt
              ? new Date(session.createdAt).toLocaleDateString()
              : "Not available"}
          </p>
        </article>
      ))}

      <Link to="/speaking/topics">Start a New Session</Link>
    </main>
  );
}
