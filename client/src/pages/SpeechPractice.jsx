
import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { speakingService } from "../services/speakingService";

export default function SpeechPractice() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const recognitionRef = useRef(null);

  const [transcript, setTranscript] = useState("");
  const [listening, setListening] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const topic = state?.topic || "Artificial Intelligence";
  const difficulty = state?.difficulty || "Beginner";
  const duration = state?.duration || 2;

  useEffect(() => {
    if (!listening) return;

    const timer = setInterval(() => {
      setSeconds((previous) => previous + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [listening]);

  useEffect(() => {
    if (seconds >= duration * 60 && listening) {
      stopRecording();
    }
  }, [seconds, duration, listening]);

  function startRecording() {
    const SpeechRecognition =
      window.SpeechRecognition ||
      window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setError(
        "Speech recognition is not supported in this browser. Try a supported browser or connect an STT service."
      );
      return;
    }

    setError("");

    const recognition = new SpeechRecognition();
    recognition.lang = "en-US";
    recognition.continuous = true;
    recognition.interimResults = true;

    
recognition.onresult = (event) => {
  let finalText = "";

  for (let i = event.resultIndex; i < event.results.length; i++) {
    const result = event.results[i];

    if (result.isFinal) {
      finalText += result[0].transcript + " ";
    }
  }

  if (finalText) {
    setTranscript((previous) =>
      `${previous}${finalText}`
    );
  }
};


    recognition.onerror = (event) => {
      setError(`Speech recognition error: ${event.error}`);
      setListening(false);
    };

    recognition.onend = () => {
      setListening(false);
    };

    recognitionRef.current = recognition;

    try {
      recognition.start();
      setListening(true);
    } catch {
      setError("Could not start the microphone. Please try again.");
    }
  }

  function stopRecording() {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setListening(false);
  }

  async function submitSpeech() {
    if (!transcript.trim()) {
      setError("Please record your speech before submitting.");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const created = await speakingService.createSession({
        topic,
        difficulty,
        duration,
      });

      const sessionId =
        created.session?._id ||
        created.session?.id ||
        created._id ||
        created.id;

      if (!sessionId) {
        throw new Error("The server did not return a session ID.");
      }

      const report = await speakingService.evaluateSpeech(
        sessionId,
        { transcript, topic, difficulty, duration, speakingSeconds: seconds }
      );

      navigate("/speaking/report", {
        state: {
          topic,
          transcript,
          sessionId,
          report,
        },
      });
    } catch (err) {
      setError(err.message || "Unable to evaluate your speech.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="speaking-page">
      <h1>Speech Practice</h1>
      <h2>{topic}</h2>
      <p>Difficulty: {difficulty}</p>
      <p>Time: {Math.floor(seconds / 60)}:
        {String(seconds % 60).padStart(2, "0")} / {duration}:00
      </p>

      <button onClick={startRecording} disabled={listening}>
        Start Speaking
      </button>

      <button onClick={stopRecording} disabled={!listening}>
        Stop Speaking
      </button>

      <h3>Your Transcript</h3>
      <textarea
        rows={9}
        value={transcript}
        onChange={(e) => setTranscript(e.target.value)}
        placeholder="Your recognized speech will appear here. You can also edit it."
      />

      {error && <p role="alert">{error}</p>}

      <button
        onClick={submitSpeech}
        disabled={listening || submitting || !transcript.trim()}
      >
        {submitting ? "Evaluating..." : "Evaluate My Speech"}
      </button>
    </main>
  );
}
