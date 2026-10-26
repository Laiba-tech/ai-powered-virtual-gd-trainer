
interface TranscriptPanelProps {
  transcript: string;
  onTranscriptChange: (value: string) => void;
}

export default function TranscriptPanel({
  transcript,
  onTranscriptChange,
}: TranscriptPanelProps) {
  return (
    <section className="transcript-panel">
      <h2>Your Speech Transcript</h2>

      <textarea
        value={transcript}
        onChange={(event) =>
          onTranscriptChange(event.target.value)
        }
        placeholder="Your spoken words will appear here..."
        rows={8}
      />

      <p>Word count: {transcript.trim() ? transcript.trim().split(/\s+/).length : 0}</p>
    </section>
  );
}
