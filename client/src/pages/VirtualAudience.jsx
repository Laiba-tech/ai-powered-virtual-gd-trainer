
import { useState } from "react";
import { speakingService } from "../services/speakingService";

export default function VirtualAudience() {
  const [sessionId, setSessionId] = useState("");
  const [transcript, setTranscript] = useState("");
  const [reaction, setReaction] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function generateReaction() {
    if (!sessionId.trim() || !transcript.trim()) {
      setError("Enter a session ID and a speech excerpt.");
      return;
    }

    setLoading(true);
    setError("");
    setReaction("");

    try {
      const result = await speakingService.getAudienceReaction(
        sessionId.trim(),
        { transcript }
      );

      setReaction(
        result.reaction ||
        result.question ||
        result.message ||
        "No audience response was returned."
      );
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="speaking-page">
      <h1>AI Virtual Audience</h1>
      <p>Practice responding to questions from a simulated audience.</p>

      <label htmlFor="sessionId">Practice session ID</label>
      <input
        id="sessionId"
        value={sessionId}
        onChange={(e) => setSessionId(e.target.value)}
        placeholder="Enter your saved session ID"
      />

      <label htmlFor="transcript">Speech excerpt</label>
      <textarea
        id="transcript"
        rows={6}
        value={transcript}
        onChange={(e) => setTranscript(e.target.value)}
        placeholder="Paste a section of your speech"
      />

      <button onClick={generateReaction} disabled={loading}>
        {loading ? "Generating..." : "Ask the Audience"}
      </button>

      {error && <p role="alert">{error}</p>}
      {reaction && (
        <section className="speaking-card">
          <h2>Audience Response</h2>
          <p>{reaction}</p>
        </section>
      )}
    </main>
  );
}
