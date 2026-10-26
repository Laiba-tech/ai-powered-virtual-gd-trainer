
interface SpeechScoreCardProps {
  score: number;
  criteria: {
    contentRelevance?: number;
    structure?: number;
    fluency?: number;
    vocabulary?: number;
  };
}

export default function SpeechScoreCard({
  score,
  criteria,
}: SpeechScoreCardProps) {
  const items = [
    ["Content relevance", criteria.contentRelevance],
    ["Structure", criteria.structure],
    ["Fluency", criteria.fluency],
    ["Vocabulary", criteria.vocabulary],
  ] as const;

  return (
    <section className="speech-score-card">
      <h2>Speech Evaluation</h2>

      <div className="overall-score">
        <span>Overall score</span>
        <h1>{score}/100</h1>
      </div>

      {items.map(([label, value]) => (
        <div key={label} className="score-item">
          <div className="score-label">
            <span>{label}</span>
            <strong>{value ?? 0}/100</strong>
          </div>

          <progress value={value ?? 0} max={100} />
        </div>
      ))}
    </section>
  );
}
