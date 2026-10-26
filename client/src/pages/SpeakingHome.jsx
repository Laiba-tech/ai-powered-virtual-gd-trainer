
import { Link } from "react-router-dom";

export default function SpeakingHome() {
  return (
    <main className="speaking-page">
      <h1>Public Speaking Practice</h1>
      <p>
        Practice speeches, improve your delivery, and get
        personalized feedback from your AI speaking coach.
      </p>

      <div className="speaking-cards">
        <Link to="/speaking/topics" className="speaking-card">
          <h2>Start Practicing</h2>
          <p>Choose a topic and deliver your speech.</p>
        </Link>

        <Link to="/speaking/history" className="speaking-card">
          <h2>My Progress</h2>
          <p>Review your previous practice sessions.</p>
        </Link>

        <Link to="/speaking/audience" className="speaking-card">
          <h2>Virtual Audience</h2>
          <p>Practice handling audience questions.</p>
        </Link>
      </div>
    </main>
  );
}
