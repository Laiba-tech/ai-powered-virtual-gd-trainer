
import { useRef, useState } from "react";

interface SpeechRecorderProps {
  onTranscript: (text: string) => void;
}

export default function SpeechRecorder({
  onTranscript,
}: SpeechRecorderProps) {
  const recognitionRef = useRef<any>(null);
  const [recording, setRecording] = useState(false);
  const [error, setError] = useState("");

  function startRecording() {
    setError("");

    const SpeechRecognitionAPI =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (!SpeechRecognitionAPI) {
      setError("Speech recognition is not supported in this browser.");
      return;
    }

    const recognition = new SpeechRecognitionAPI();
    recognition.lang = "en-US";
    recognition.continuous = true;
    recognition.interimResults = false;

    recognition.onresult = (event: any) => {
      let text = "";

      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          text += event.results[i][0].transcript + " ";
        }
      }

      if (text.trim()) {
        onTranscript(text);
      }
    };

    recognition.onerror = () => {
      setError("Unable to recognize speech. Check microphone permission.");
      setRecording(false);
    };

    recognition.onend = () => setRecording(false);

    recognitionRef.current = recognition;
    recognition.start();
    setRecording(true);
  }

  function stopRecording() {
    recognitionRef.current?.stop();
    setRecording(false);
  }

  return (
    <section className="speech-recorder">
      <h2>Speech Recorder</h2>

      {!recording ? (
        <button onClick={startRecording}>
          Start Speaking
        </button>
      ) : (
        <button onClick={stopRecording}>
          Stop Speaking
        </button>
      )}

      {error && <p role="alert">{error}</p>}
    </section>
  );
}
