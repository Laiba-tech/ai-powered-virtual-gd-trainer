
interface AudiencePanelProps {
  reaction: string;
  loading?: boolean;
  onRequestReaction?: () => void;
}

export default function AudiencePanel({
  reaction,
  loading = false,
  onRequestReaction,
}: AudiencePanelProps) {
  return (
    <section className="audience-panel">
      <h2>Virtual Audience</h2>

      <p>
        {loading
          ? "The audience is preparing a response..."
          : reaction || "Complete part of your speech to receive audience feedback."}
      </p>

      {onRequestReaction && (
        <button onClick={onRequestReaction} disabled={loading}>
          Get Audience Feedback
        </button>
      )}
    </section>
  );
}
