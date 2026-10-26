import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

const speakText = (text: string): Promise<void> => {
  return new Promise((resolve) => {
    if (!("speechSynthesis" in window)) {
      resolve();
      return;
    }

    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "en-IN";
    utterance.rate = 1;
    utterance.pitch = 1;

    utterance.onend = () => resolve();
    utterance.onerror = () => resolve();

    window.speechSynthesis.speak(utterance);
  });
};

type Session = {
  _id: string;
  topic: string;
  difficulty: string;
  duration: number;
  status: string;
};

type SpeechRecognitionEvent = Event & {
  results: SpeechRecognitionResultList;
};

interface SpeechRecognitionInstance {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
}

interface SpeechRecognitionConstructor {
  new (): SpeechRecognitionInstance;
}

declare global {
  interface Window {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  }
}

function GDRoom() {
  const location = useLocation();
  const navigate = useNavigate();

  const session = location.state?.session as Session | undefined;

  // Speech recognition state
  const [isListening, setIsListening] = useState(false);
  const [isEnding, setIsEnding] = useState(false);
  const [transcript, setTranscript] = useState("");

  const [analyticalResponse, setAnalyticalResponse] = useState("");
  const [criticalResponse, setCriticalResponse] = useState("");
  const [supportiveResponse, setSupportiveResponse] = useState("");

  const [thinkingParticipant, setThinkingParticipant] = useState("");

  const [speakingTime, setSpeakingTime] = useState(0);
  const [wordCount, setWordCount] = useState(0);
  const [wpm, setWpm] = useState(0);
  const [fillerCount, setFillerCount] = useState(0);
  const [detectedFillers, setDetectedFillers] = useState<string[]>([]);

  const startTimeRef = useRef<number | null>(null);
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const transcriptRef = useRef("");

  // Speech recognition setup
  useEffect(() => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      return;
    }

    const recognition = new SpeechRecognition();

    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-IN";

    recognition.onresult = (event) => {
      let fullTranscript = "";

      for (let i = 0; i < event.results.length; i++) {
        fullTranscript += event.results[i][0].transcript + " ";
      }

      const cleanedTranscript = fullTranscript.trim();

      transcriptRef.current = cleanedTranscript;
      setTranscript(cleanedTranscript);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.onerror = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;

    return () => {
      recognition.stop();
    };
  }, []);

  const saveUserMessage = async (
    messageText: string,
    sessionId: string
  ) => {
    try {
      const token = localStorage.getItem("token");

      if (!token) {
        console.error("No authentication token found.");
        return;
      }

      const response = await fetch(
        `http://localhost:5000/api/gd-sessions/${sessionId}/messages`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            speaker: "user",
            participant: "user",
            text: messageText,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        console.error("Failed to save message:", data.message);
        return;
      }

      console.log("User message saved:", data.data);
    } catch (error) {
      console.error("Error saving user message:", error);
    }
  };

  const getAIResponse = async (participant: string) => {
    try {
      const token = localStorage.getItem("token");

      if (!token) {
        console.error("No authentication token found.");
        return;
      }

      setThinkingParticipant(participant);

      const response = await fetch(
        `http://localhost:5000/api/gd-sessions/${session?._id}/ai-response`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            participant,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        console.error("Failed to generate AI response:", data.message);
        return;
      }

      if (participant === "analytical") {
        setAnalyticalResponse(data.data.text);
      } else if (participant === "critical") {
        setCriticalResponse(data.data.text);
      } else if (participant === "supportive") {
        setSupportiveResponse(data.data.text);
      }

      await speakText(data.data.text);
    } catch (error) {
      console.error("Error getting AI response:", error);
    } finally {
      setThinkingParticipant("");
    }
  };

  // Start / Stop speech recognition
  const toggleListening = async () => {
    if (!recognitionRef.current) {
      alert(
        "Speech recognition is not supported in this browser. Please use Google Chrome."
      );
      return;
    }

    if (isListening) {
      // Stop the speech timer immediately
      let elapsed = 0;

      if (startTimeRef.current) {
        elapsed =
          (Date.now() - startTimeRef.current) / 1000;

        setSpeakingTime(elapsed);
        startTimeRef.current = null;
      }

      // Stop speech recognition
      recognitionRef.current.stop();
      setIsListening(false);

      // Save user message and start AI turns
      const finalTranscript = transcriptRef.current.trim();

      if (finalTranscript && session) {
        await saveUserMessage(finalTranscript, session._id);

        await getAIResponse("analytical");
        await getAIResponse("critical");
        await getAIResponse("supportive");
      }
    } else {
      setTranscript("");
      transcriptRef.current = "";

      setSpeakingTime(0);
      setWordCount(0);
      setWpm(0);
      setFillerCount(0);
      setDetectedFillers([]);

      startTimeRef.current = Date.now();

      recognitionRef.current.start();
      setIsListening(true);
    }
  };

  const handleEndGD = async () => {
    if (!session || isEnding) return;

    const confirmEnd = window.confirm(
      "Are you sure you want to end this GD session?"
    );

    if (!confirmEnd) return;

    setIsEnding(true);

    try {
      // Stop any ongoing AI voice
      window.speechSynthesis.cancel();

      // Stop microphone recognition
      if (recognitionRef.current && isListening) {
        recognitionRef.current.stop();
      }

      setIsListening(false);

      const token = localStorage.getItem("token");

      if (!token) {
        throw new Error("Please log in again.");
      }

      const response = await fetch(
        `http://localhost:5000/api/gd-sessions/${session._id}/complete`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to complete GD session.");
      }

      navigate("/gd-report", { state: { session: data.session } });
    } catch (error) {
      console.error("Error ending GD session:", error);

      alert(
        error instanceof Error
          ? error.message
          : "Could not end the GD session. Please try again."
      );
    } finally {
      setIsEnding(false);
    }
  };

  const detectFillerWords = (text: string) => {
    const fillerWords = [
      "um",
      "uh",
      "like",
      "actually",
      "basically",
      "you know",
      "i mean",
      "sort of",
      "kind of",
    ];

    const lowerText = text.toLowerCase();

    const detected: string[] = [];

    fillerWords.forEach((filler) => {
      const regex = new RegExp(`\\b${filler}\\b`, "gi");
      const matches = lowerText.match(regex);

      if (matches) {
        for (let i = 0; i < matches.length; i++) {
          detected.push(filler);
        }
      }
    });

    setFillerCount(detected.length);
    setDetectedFillers(detected);
  };

  useEffect(() => {
    if (!transcript) {
      setWordCount(0);
      setWpm(0);
      setFillerCount(0);
      setDetectedFillers([]);
      return;
    }

    const words = transcript
      .trim()
      .split(/\s+/)
      .filter(Boolean);

    const count = words.length;

    setWordCount(count);

    if (speakingTime > 0) {
      const minutes = speakingTime / 60;
      setWpm(Math.round(count / minutes));
    }

    detectFillerWords(transcript);
  }, [transcript, speakingTime]);

  // If someone opens /gd-room directly without creating a session
  if (!session) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 px-6 text-white">
        <div className="text-center">
          <h1 className="text-2xl font-bold">
            No active GD session found.
          </h1>

          <p className="mt-3 text-slate-400">
            Please create a GD session before entering the room.
          </p>

          <button
            onClick={() => navigate("/gd-setup")}
            className="mt-6 rounded-xl bg-white px-6 py-3 font-semibold text-slate-950"
          >
            Go to GD Setup
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Header */}
      <header className="border-b border-white/10">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <div>
            <h1 className="text-xl font-bold">
              Virtual GD Trainer
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Virtual Group Discussion
            </p>
          </div>

          <button
            onClick={handleEndGD}
            disabled={isEnding}
            className="rounded-xl bg-white px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isEnding ? "Ending GD..." : "End GD"}
          </button>
        </div>
      </header>

      {/* Session Information */}
      <main className="mx-auto max-w-7xl px-6 py-8">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
              Discussion Topic
            </p>

            <h2 className="mt-2 text-3xl font-bold">
              {session.topic}
            </h2>
          </div>

          <div className="flex gap-3">
            <div className="rounded-xl border border-white/10 bg-slate-900 px-4 py-3">
              <p className="text-xs text-slate-500">Difficulty</p>

              <p className="mt-1 text-sm font-medium">
                {session.difficulty}
              </p>
            </div>

            <div className="rounded-xl border border-white/10 bg-slate-900 px-4 py-3">
              <p className="text-xs text-slate-500">Duration</p>

              <p className="mt-1 text-sm font-medium">
                {session.duration} min
              </p>
            </div>
          </div>
        </div>

        {/* Participants */}
        <div className="grid gap-6 md:grid-cols-3">
          {/* AI Participant 1 */}
          <div className="min-h-[300px] rounded-2xl border border-white/10 bg-slate-900 p-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-800 text-xl">
                🤖
              </div>

              <div>
                <h3 className="font-semibold">
                  AI Participant 1
                </h3>

                <p className="text-sm text-slate-500">
                  Analytical
                </p>
              </div>
            </div>

            <div className="mt-10 text-sm text-slate-300">
              {thinkingParticipant === "analytical" ? (
                <span className="text-slate-500">
                  Analytical AI is thinking...
                </span>
              ) : analyticalResponse ? (
                analyticalResponse
              ) : (
                <span className="text-slate-500">
                  Waiting to speak...
                </span>
              )}
            </div>
          </div>

          {/* AI Participant 2 */}
          <div className="min-h-[300px] rounded-2xl border border-white/10 bg-slate-900 p-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-800 text-xl">
                🤖
              </div>

              <div>
                <h3 className="font-semibold">
                  AI Participant 2
                </h3>

                <p className="text-sm text-slate-500">
                  Critical
                </p>
              </div>
            </div>

            <div className="mt-10 text-sm text-slate-300">
              {thinkingParticipant === "critical" ? (
                <span className="text-slate-500">
                  Critical AI is thinking...
                </span>
              ) : criticalResponse ? (
                criticalResponse
              ) : (
                <span className="text-slate-500">
                  Waiting to speak...
                </span>
              )}
            </div>
          </div>

          {/* AI Participant 3 */}
          <div className="min-h-[300px] rounded-2xl border border-white/10 bg-slate-900 p-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-800 text-xl">
                🤖
              </div>

              <div>
                <h3 className="font-semibold">
                  AI Participant 3
                </h3>

                <p className="text-sm text-slate-500">
                  Supportive
                </p>
              </div>
            </div>

            <div className="mt-10 text-sm text-slate-300">
              {thinkingParticipant === "supportive" ? (
                <span className="text-slate-500">
                  Supportive AI is thinking...
                </span>
              ) : supportiveResponse ? (
                supportiveResponse
              ) : (
                <span className="text-slate-500">
                  Waiting to speak...
                </span>
              )}
            </div>
          </div>
        </div>

        {/* User Speaking Area */}
        <div className="mt-6 rounded-2xl border border-white/10 bg-slate-900 p-8">
          <div className="text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-slate-800 text-2xl">
              🎙️
            </div>

            <h3 className="mt-5 text-xl font-semibold">
              Your Turn
            </h3>

            <p className="mt-2 text-sm text-slate-500">
              Your microphone and speech analysis will appear here.
            </p>

            {/* Transcript */}
            {transcript && (
              <div className="mx-auto mt-6 max-w-2xl rounded-xl border border-white/10 bg-slate-950 p-5 text-left">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Your Speech
                </p>

                <p className="mt-3 leading-7 text-slate-300">
                  {transcript}
                </p>

                {/* Speech Metrics */}
                <div className="mt-6 grid grid-cols-4 gap-3">
                  <div className="rounded-lg border border-white/10 bg-slate-900 p-3">
                    <p className="text-xs text-slate-500">
                      Duration
                    </p>

                    <p className="mt-1 font-semibold">
                      {speakingTime.toFixed(1)} sec
                    </p>
                  </div>

                  <div className="rounded-lg border border-white/10 bg-slate-900 p-3">
                    <p className="text-xs text-slate-500">
                      Words
                    </p>

                    <p className="mt-1 font-semibold">
                      {wordCount}
                    </p>
                  </div>

                  <div className="rounded-lg border border-white/10 bg-slate-900 p-3">
                    <p className="text-xs text-slate-500">
                      WPM
                    </p>

                    <p className="mt-1 font-semibold">
                      {wpm}
                    </p>
                  </div>

                  <div className="rounded-lg border border-white/10 bg-slate-900 p-3">
                    <p className="text-xs text-slate-500">
                      Filler Words
                    </p>

                    <p className="mt-1 font-semibold">
                      {fillerCount}
                    </p>
                  </div>
                </div>

                {detectedFillers.length > 0 && (
                  <div className="mt-4">
                    <p className="text-xs text-slate-500">
                      Detected Fillers
                    </p>

                    <div className="mt-2 flex flex-wrap gap-2">
                      {detectedFillers.map((filler, index) => (
                        <span
                          key={`${filler}-${index}`}
                          className="rounded-full border border-white/10 bg-slate-900 px-3 py-1 text-xs text-slate-400"
                        >
                          {filler}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Start / Stop Speaking */}
            <button
              onClick={toggleListening}
              className={`mt-6 rounded-xl px-7 py-3.5 font-semibold transition ${
                isListening
                  ? "bg-red-500 text-white hover:bg-red-400"
                  : "bg-white text-slate-950 hover:bg-slate-200"
              }`}
            >
              {isListening ? "Stop Speaking" : "Start Speaking"}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}

export default GDRoom;