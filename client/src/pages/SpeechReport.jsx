
import { useLocation, Link } from "react-router-dom";

export default function SpeechReport() {
  const { state } = useLocation();
  const report = state?.report?.evaluation || state?.report || {};

  if (!state) {
    return (
      <main className="speaking-page">
        <h1>Speech Report</h1>
        <p>No report is available. Complete a practice session first.</p>
        <Link to="/speaking/topics">Start Practice</Link>
      </main>
    );
  }

  const criteria = report.criteria || {};

  return (
    <main className="speaking-page">
      <h1>Your Speech Report</h1>
      <h2>{state.topic}</h2>

      <section className="speaking-card">
        <h3>Overall Score</h3>
        <p>{report.overallScore ?? "Not available"}</p>
      </section>

      <section className="speaking-card">
        <h3>Speaking Analysis</h3>
        {Object.keys(criteria).length ? (
          Object.entries(criteria).map(([key, value]) => (
            <p key={key}>
              <strong>{key.replace(/([A-Z])/g, " $1")}: </strong>
              {typeof value === "object"
                ? JSON.stringify(value)
                : String(value)}
            </p>
          ))
        ) : (
          <p>{report.feedback || "No detailed criteria were returned."}</p>
        )}
      </section>

      <section className="speaking-card">
        <h3>Strengths</h3>
        <ul>
          {(report.strengths || []).map((item, index) => (
            <li key={index}>{item}</li>
          ))}
        </ul>
      </section>

      <section className="speaking-card">
        <h3>Areas to Improve</h3>
        <ul>
          {(report.improvements || []).map((item, index) => (
            <li key={index}>{item}</li>
          ))}
        </ul>
      </section>

      <section className="speaking-card">
        <h3>Transcript</h3>
        <p>{state.transcript}</p>
      </section>

      <Link to="/speaking/topics">Practice Again</Link>
      {" | "}
      <Link to="/speaking/history">View History</Link>
    </main>
  );
}
