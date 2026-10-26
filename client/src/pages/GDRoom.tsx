import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

const speakText = (text: string, signal: AbortSignal): Promise<void> => {
  return new Promise((resolve) => {
    if (!("speechSynthesis" in window)) {
      resolve();
      return;
    }

    const synthesis = window.speechSynthesis;
    let settled = false;
    const finish = () => {
      if (settled) return;
      settled = true;
      signal.removeEventListener("abort", cancelSpeech);
      resolve();
    };
    const cancelSpeech = () => {
      synthesis.cancel();
      finish();
    };

    if (signal.aborted) {
      finish();
      return;
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "en-IN";
    utterance.rate = 1;
    utterance.pitch = 1;

    signal.addEventListener("abort", cancelSpeech, { once: true });
    utterance.onend = finish;
    utterance.onerror = finish;

    synthesis.cancel();
    synthesis.speak(utterance);
  });
};

type Session = {
  _id: string;
  topic: string;
  difficulty: string;
  duration: number;
  status: string;
};

type Participant = "analytical" | "critical" | "supportive";
const formatSessionCountdown = (totalSeconds: number) => {
  const minutes = Math.floor(totalSeconds / 60)
    .toString()
    .padStart(2, "0");
  const seconds = (totalSeconds % 60).toString().padStart(2, "0");
  return `${minutes}:${seconds}`;
};

type AIRequest = {
  id: number;
  key: string;
  participant: Participant;
  userMessageId: string;
  generation: number;
  controller: AbortController;
};

const participantRotation: Participant[] = [
  "analytical",
  "critical",
  "supportive",
];

type SpeechRecognitionEvent = Event & {
  results: SpeechRecognitionResultList;
};

type SpeechRecognitionErrorEvent = Event & {
  error: string;
};

interface SpeechRecognitionInstance {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onend: (() => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
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
  const speechRecognitionSupported =
    typeof window !== "undefined" &&
    Boolean(window.SpeechRecognition || window.webkitSpeechRecognition);

  const session = location.state?.session as Session | undefined;
  const roomSessionId = session?._id;

  // Speech recognition state
  const [isListening, setIsListening] = useState(false);
  const [isEnding, setIsEnding] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [turnSaved, setTurnSaved] = useState(false);
  const [isSavingTurn, setIsSavingTurn] = useState(false);
  const [speechMessage, setSpeechMessage] = useState("");

  const [analyticalResponse, setAnalyticalResponse] = useState("");
  const [criticalResponse, setCriticalResponse] = useState("");
  const [supportiveResponse, setSupportiveResponse] = useState("");
  const [aiResponseErrors, setAIResponseErrors] = useState<
    Partial<Record<Participant, string>>
  >({});
  const [latestUserMessageId, setLatestUserMessageId] = useState("");
  const [isAIResponding, setIsAIResponding] = useState(false);
  const [responseWindowSeconds, setResponseWindowSeconds] = useState<number | null>(null);
  const [responseWindowHasNextAI, setResponseWindowHasNextAI] = useState(false);
  const selectedDurationSeconds = Number(session?.duration);
  const initialSessionSeconds = Number.isFinite(selectedDurationSeconds)
    ? Math.max(0, Math.ceil(selectedDurationSeconds * 60))
    : 0;
  const [sessionTimerDisplay, setSessionTimerDisplay] = useState({
    sessionId: session?._id ?? "",
    seconds: initialSessionSeconds,
  });
  const sessionSecondsRemaining =
    sessionTimerDisplay.sessionId === session?._id
      ? sessionTimerDisplay.seconds
      : initialSessionSeconds;
  const [expiredSessionId, setExpiredSessionId] = useState<string | null>(null);
  const sessionTimeExpired = expiredSessionId === session?._id;

  const [thinkingParticipant, setThinkingParticipant] = useState("");

  const [speakingTime, setSpeakingTime] = useState(0);
  const [wordCount, setWordCount] = useState(0);
  const [wpm, setWpm] = useState(0);
  const [fillerCount, setFillerCount] = useState(0);
  const [detectedFillers, setDetectedFillers] = useState<string[]>([]);

  const startTimeRef = useRef<number | null>(null);
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const transcriptRef = useRef("");
  const finalTranscriptRef = useRef("");
  const recognitionActiveRef = useRef(false);
  const recognitionStartingRef = useRef(false);
  const isListeningRef = useRef(false);
  const stopRecognitionRef = useRef<(() => void) | null>(null);
  const turnSavedRef = useRef(false);
  const finishTurnPromiseRef = useRef<Promise<boolean> | null>(null);
  const latestUserMessageIdRef = useRef("");
  const isSavingTurnRef = useRef(false);
  const isEndingRef = useRef(false);
  const isAIRespondingRef = useRef(false);
  const aiGenerationRef = useRef(0);
  const aiRequestSequenceRef = useRef(0);
  const activeAIRequestRef = useRef<AIRequest | null>(null);
  const aiRequestsInFlightRef = useRef(new Map<string, number>());
  const aiParticipantsByTurnRef = useRef(new Map<string, Set<Participant>>());
  const nextParticipantIndexRef = useRef(0);
  const responseWindowTimerRef = useRef<number | null>(null);
  const responseWindowSequenceRef = useRef(0);
  const sessionTimerRef = useRef<number | null>(null);
  const sessionDeadlineRef = useRef<number | null>(null);
  const sessionTimerIdRef = useRef<string | null>(null);
  const sessionDeadlineReachedRef = useRef(false);
  const sessionCompletionSucceededRef = useRef(false);
  const isFinalizingSpeechRef = useRef(false);
  const completeSessionHandlerRef = useRef<(() => void) | null>(null);

  const updateListeningState = (listening: boolean) => {
    isListeningRef.current = listening;
    setIsListening(listening);
  };

  const updateSavingTurnState = (saving: boolean) => {
    isSavingTurnRef.current = saving;
    setIsSavingTurn(saving);
  };

  const updateAIRespondingState = (responding: boolean) => {
    isAIRespondingRef.current = responding;
    setIsAIResponding(responding);
  };

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
      if (
        sessionCompletionSucceededRef.current ||
        (sessionDeadlineReachedRef.current && !isFinalizingSpeechRef.current)
      ) {
        return;
      }

      const finalParts: string[] = [];
      const interimParts: string[] = [];

      for (let i = 0; i < event.results.length; i++) {
        const result = event.results[i];
        const text = result[0].transcript.trim();

        if (!text) continue;

        if (result.isFinal) {
          finalParts.push(text);
        } else {
          interimParts.push(text);
        }
      }

      const finalTranscript = finalParts.join(" ").trim();
      const cleanedTranscript = [finalTranscript, interimParts.join(" ").trim()]
        .filter(Boolean)
        .join(" ");

      finalTranscriptRef.current = finalTranscript;
      transcriptRef.current = cleanedTranscript;
      setTranscript(cleanedTranscript);
    };

    recognition.onend = () => {
      recognitionActiveRef.current = false;
      recognitionStartingRef.current = false;
      updateListeningState(false);
      if (stopRecognitionRef.current) {
        stopRecognitionRef.current();
      } else if (!finalTranscriptRef.current.trim()) {
        setSpeechMessage("No speech was detected. Try again when you are ready.");
      }
    };

    recognition.onerror = (event) => {
      updateListeningState(false);

      if (event.error === "not-allowed" || event.error === "service-not-allowed") {
        recognitionActiveRef.current = false;
        setSpeechMessage(
          "Microphone access was denied. Allow microphone access in your browser settings, then try again."
        );
      } else if (event.error === "audio-capture") {
        recognitionActiveRef.current = false;
        setSpeechMessage(
          "No microphone was found. Connect or enable a microphone, then try again."
        );
      } else if (event.error !== "no-speech" && event.error !== "aborted") {
        setSpeechMessage("Speech recognition stopped unexpectedly. Please try again.");
      }

      if (!recognitionActiveRef.current) {
        recognitionStartingRef.current = false;
        stopRecognitionRef.current?.();
      }
    };

    recognitionRef.current = recognition;

    return () => {
      aiGenerationRef.current += 1;
      activeAIRequestRef.current?.controller.abort();
      activeAIRequestRef.current = null;
      if (responseWindowTimerRef.current !== null) {
        window.clearInterval(responseWindowTimerRef.current);
        responseWindowTimerRef.current = null;
      }
      responseWindowSequenceRef.current += 1;
      if (sessionTimerRef.current !== null) {
        window.clearInterval(sessionTimerRef.current);
        sessionTimerRef.current = null;
      }
      if ("speechSynthesis" in window) window.speechSynthesis.cancel();
      recognition.stop();
    };
  }, []);

  const stopRecognitionAndGetTranscript = async (timeoutMs?: number) => {
    const recognition = recognitionRef.current;

    if (!recognition || !recognitionActiveRef.current) {
      return (finalTranscriptRef.current || transcriptRef.current).trim();
    }

    return new Promise<string>((resolve) => {
      let resolved = false;
      let timeoutId: number | null = null;
      const finish = () => {
        if (resolved) return;
        resolved = true;
        if (timeoutId !== null) window.clearTimeout(timeoutId);
        stopRecognitionRef.current = null;
        resolve((finalTranscriptRef.current || transcriptRef.current).trim());
      };

      stopRecognitionRef.current = finish;

      if (timeoutMs !== undefined) {
        timeoutId = window.setTimeout(finish, timeoutMs);
      }

      try {
        recognition.stop();
      } catch {
        finish();
      }
    });
  };

  const saveUserMessage = async (
    messageText: string,
    sessionId: string
  ): Promise<string | null> => {
    try {
      const token = localStorage.getItem("token");

      if (!token) {
        setSpeechMessage("Please log in again before saving your speech.");
        return null;
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

      if (sessionCompletionSucceededRef.current) return null;

      if (!response.ok) {
        setSpeechMessage(data.message || "Unable to save your speech. Please try again.");
        return null;
      }

      const savedMessageId = data.data?._id;
      if (typeof savedMessageId !== "string" || !savedMessageId) {
        setSpeechMessage("The server did not confirm that your speech was saved.");
        return null;
      }

      latestUserMessageIdRef.current = savedMessageId;
      setLatestUserMessageId(savedMessageId);
      console.log("User message saved:", data.data);
      return savedMessageId;
    } catch (error) {
      console.error("Error saving user message:", error);
      if (!sessionCompletionSucceededRef.current) {
        setSpeechMessage("Unable to save your speech. Check your connection and try again.");
      }
      return null;
    }
  };

  const getAIResponse = async (
    participant: Participant,
    userMessageId: string
  ): Promise<boolean> => {
    const key = `${userMessageId}:${participant}`;
    if (
      !session ||
      isEndingRef.current ||
      sessionDeadlineReachedRef.current ||
      userMessageId !== latestUserMessageIdRef.current ||
      activeAIRequestRef.current ||
      aiRequestsInFlightRef.current.has(key)
    ) {
      return false;
    }

    const request: AIRequest = {
      id: ++aiRequestSequenceRef.current,
      key,
      participant,
      userMessageId,
      generation: aiGenerationRef.current,
      controller: new AbortController(),
    };
    activeAIRequestRef.current = request;
    aiRequestsInFlightRef.current.set(key, request.id);
    updateAIRespondingState(true);
    setThinkingParticipant(participant);

    const isCurrent = () =>
      activeAIRequestRef.current?.id === request.id &&
      aiGenerationRef.current === request.generation &&
      !request.controller.signal.aborted &&
      latestUserMessageIdRef.current === userMessageId &&
      !sessionDeadlineReachedRef.current &&
      !isEndingRef.current;

    try {
      const token = localStorage.getItem("token");

      if (!token) {
        setAIResponseErrors((errors) =>
          isCurrent()
            ? {
                ...errors,
                [participant]: "Please log in again to request an AI response.",
              }
            : errors
        );
        return false;
      }

      setAIResponseErrors((errors) => {
        if (!isCurrent()) return errors;
        const nextErrors = { ...errors };
        delete nextErrors[participant];
        return nextErrors;
      });

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
            userMessageId,
          }),
          signal: request.controller.signal,
        }
      );
      if (!isCurrent()) return false;

      let data: { message?: string; data?: { text?: string } } = {};
      try {
        data = await response.json();
      } catch {
        // Handle non-JSON server errors with the same participant-level retry UI.
      }
      if (!isCurrent()) return false;

      if (!response.ok) {
        setAIResponseErrors((errors) =>
          isCurrent()
            ? {
                ...errors,
                [participant]: data.message || "This participant could not respond. Please retry.",
              }
            : errors
        );
        return false;
      }

      const responseText = data.data?.text?.trim();
      if (!responseText) {
        setAIResponseErrors((errors) =>
          isCurrent()
            ? {
                ...errors,
                [participant]: "The AI returned an empty response. Please retry.",
              }
            : errors
        );
        return false;
      }

      const respondedParticipants =
        aiParticipantsByTurnRef.current.get(userMessageId) ?? new Set<Participant>();
      respondedParticipants.add(participant);
      aiParticipantsByTurnRef.current.set(userMessageId, respondedParticipants);

      if (participant === "analytical") {
        setAnalyticalResponse(responseText);
      } else if (participant === "critical") {
        setCriticalResponse(responseText);
      } else if (participant === "supportive") {
        setSupportiveResponse(responseText);
      }

      setThinkingParticipant("");
      await speakText(responseText, request.controller.signal);
      if (!isCurrent()) return false;
      startResponseWindow(request);
      return true;
    } catch (error) {
      if (!isCurrent() || request.controller.signal.aborted) return false;
      console.error("Error getting AI response:", error);
      setAIResponseErrors((errors) =>
        isCurrent()
          ? {
              ...errors,
              [participant]: "Unable to reach the local AI service. Please retry.",
            }
          : errors
      );
      return false;
    } finally {
      if (aiRequestsInFlightRef.current.get(key) === request.id) {
        aiRequestsInFlightRef.current.delete(key);
      }
      if (activeAIRequestRef.current?.id === request.id) {
        activeAIRequestRef.current = null;
        setThinkingParticipant("");
        updateAIRespondingState(false);
      }
    }
  };

  const invalidateAIWork = (clearResponses: boolean) => {
    aiGenerationRef.current += 1;
    clearResponseWindow();
    const activeRequest = activeAIRequestRef.current;
    activeAIRequestRef.current = null;
    activeRequest?.controller.abort();
    if ("speechSynthesis" in window) window.speechSynthesis.cancel();
    setThinkingParticipant("");
    updateAIRespondingState(false);
    if (clearResponses) {
      setAnalyticalResponse("");
      setCriticalResponse("");
      setSupportiveResponse("");
    }
  };

  const clearResponseWindow = () => {
    responseWindowSequenceRef.current += 1;
    if (responseWindowTimerRef.current !== null) {
      window.clearInterval(responseWindowTimerRef.current);
      responseWindowTimerRef.current = null;
    }
    setResponseWindowSeconds(null);
    setResponseWindowHasNextAI(false);
  };

  const startResponseWindow = (request: AIRequest) => {
    clearResponseWindow();
    const windowSequence = ++responseWindowSequenceRef.current;
    setResponseWindowSeconds(5);
    const respondedParticipants = aiParticipantsByTurnRef.current.get(request.userMessageId);
    setResponseWindowHasNextAI(
      participantRotation.some((participant) => !respondedParticipants?.has(participant))
    );
    let secondsRemaining = 5;

    responseWindowTimerRef.current = window.setInterval(() => {
      const requestIsCurrent =
        responseWindowSequenceRef.current === windowSequence &&
        aiGenerationRef.current === request.generation &&
        latestUserMessageIdRef.current === request.userMessageId &&
        !sessionDeadlineReachedRef.current &&
        !isEndingRef.current;

      if (!requestIsCurrent) {
        clearResponseWindow();
        return;
      }

      secondsRemaining -= 1;
      if (secondsRemaining > 0) {
        setResponseWindowSeconds(secondsRemaining);
        return;
      }

      clearResponseWindow();
      requestNextAIResponse(request.userMessageId);
    }, 1000);
  };

  const getNextParticipant = (userMessageId: string): Participant | null => {
    const respondedParticipants = aiParticipantsByTurnRef.current.get(userMessageId);
    for (let offset = 0; offset < participantRotation.length; offset += 1) {
      const participantIndex =
        (nextParticipantIndexRef.current + offset) % participantRotation.length;
      const participant = participantRotation[participantIndex];
      if (!respondedParticipants?.has(participant)) {
        nextParticipantIndexRef.current =
          (participantIndex + 1) % participantRotation.length;
        return participant;
      }
    }
    return null;
  };

  const requestNextAIResponse = (userMessageId: string) => {
    if (sessionDeadlineReachedRef.current || isEndingRef.current) return;
    const participant = getNextParticipant(userMessageId);
    if (participant) void getAIResponse(participant, userMessageId);
  };

  // Start / Stop speech recognition
  const finishSpeechTurn = async (
    respondToSpeech: boolean,
    recognitionTimeoutMs?: number
  ): Promise<boolean> => {
    if (finishTurnPromiseRef.current) {
      return finishTurnPromiseRef.current;
    }

    const finishPromise = (async () => {
      updateSavingTurnState(true);
      const finalTranscript = await stopRecognitionAndGetTranscript(recognitionTimeoutMs);

      if (startTimeRef.current !== null) {
        setSpeakingTime((Date.now() - startTimeRef.current) / 1000);
        startTimeRef.current = null;
      }

      updateListeningState(false);

      if (!finalTranscript) {
        transcriptRef.current = "";
        finalTranscriptRef.current = "";
        setTranscript("");
        if (respondToSpeech) {
          setSpeechMessage("No speech was detected. Try speaking again when you are ready.");
        }
        return true;
      }

      transcriptRef.current = finalTranscript;
      finalTranscriptRef.current = finalTranscript;
      setTranscript(finalTranscript);

      if (turnSavedRef.current) return true;
      if (!session) return false;

      const userMessageId = await saveUserMessage(finalTranscript, session._id);
      if (!userMessageId) return false;
      if (sessionCompletionSucceededRef.current) return true;

      turnSavedRef.current = true;
      setTurnSaved(true);
      setSpeechMessage("");
      setAIResponseErrors({});
      setAnalyticalResponse("");
      setCriticalResponse("");
      setSupportiveResponse("");
      aiParticipantsByTurnRef.current.clear();

      if (respondToSpeech) {
        requestNextAIResponse(userMessageId);
      }

      return true;
    })();

    finishTurnPromiseRef.current = finishPromise;

    try {
      return await finishPromise;
    } finally {
      updateSavingTurnState(false);
      if (finishTurnPromiseRef.current === finishPromise) {
        finishTurnPromiseRef.current = null;
      }
    }
  };

  const toggleListening = async () => {
    if (!recognitionRef.current) {
      setSpeechMessage(
        "Speech recognition is not supported in this browser. Try Chrome or another browser that supports speech recognition."
      );
      return;
    }

    if (
      isEndingRef.current ||
      sessionDeadlineReachedRef.current ||
      isSavingTurnRef.current ||
      recognitionStartingRef.current
    ) {
      return;
    }

    if (activeAIRequestRef.current || responseWindowTimerRef.current !== null) {
      invalidateAIWork(true);
    } else {
      clearResponseWindow();
    }

    if (recognitionActiveRef.current || (transcriptRef.current.trim() && !turnSavedRef.current)) {
      setSpeechMessage("");
      await finishSpeechTurn(true);
    } else {
      setTranscript("");
      transcriptRef.current = "";
      finalTranscriptRef.current = "";
      turnSavedRef.current = false;
      setTurnSaved(false);
      setSpeechMessage("");

      setSpeakingTime(0);
      setWordCount(0);
      setWpm(0);
      setFillerCount(0);
      setDetectedFillers([]);
      setAIResponseErrors({});

      startTimeRef.current = Date.now();
      recognitionStartingRef.current = true;

      try {
        recognitionRef.current.start();
        recognitionActiveRef.current = true;
        recognitionStartingRef.current = false;
        updateListeningState(true);
      } catch (error) {
        recognitionStartingRef.current = false;
        recognitionActiveRef.current = false;
        startTimeRef.current = null;
        updateListeningState(false);
        setSpeechMessage(
          error instanceof DOMException && error.name === "NotAllowedError"
            ? "Microphone access was denied. Allow microphone access in your browser settings, then try again."
            : "Unable to start speech recognition. Please check your microphone and try again."
        );
      }
    }
  };

  const completeGDSession = async (automatic: boolean) => {
    if (!session || isEndingRef.current) return;

    isEndingRef.current = true;
    setIsEnding(true);

    try {
      invalidateAIWork(false);

      // Finalize and save any speech before completing the session.
      if (recognitionActiveRef.current || recognitionStartingRef.current || transcriptRef.current.trim()) {
        isFinalizingSpeechRef.current = true;
        const speechSavePromise = finishSpeechTurn(false, 1500).catch((error) => {
          console.error("Unable to finalize speech before session completion:", error);
          return false;
        });
        let speechSaved: boolean;
        if (automatic) {
          let timeoutId: number | null = null;
          speechSaved = await Promise.race([
            speechSavePromise,
            new Promise<boolean>((resolve) => {
              timeoutId = window.setTimeout(() => resolve(false), 4000);
            }),
          ]);
          if (timeoutId !== null) window.clearTimeout(timeoutId);
        } else {
          speechSaved = await speechSavePromise;
        }
        isFinalizingSpeechRef.current = false;

        if (!speechSaved) {
          if (!automatic) {
            throw new Error(
              "Your speech could not be saved, so the GD session was not ended. Please try again."
            );
          }
          setSpeechMessage("Session time ended. The pending speech could not be confirmed as saved.");
        }
      }

      // A pending speech-save may have started a response before End GD was clicked.
      invalidateAIWork(false);

      updateListeningState(false);

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

      let data: { message?: string; session?: Session } = {};
      try {
        data = await response.json();
      } catch {
        // Keep the user-facing failure useful if the server returns a non-JSON error.
      }

      if (!response.ok) {
        throw new Error(data.message || "Failed to complete GD session.");
      }

      if (!data.session) {
        throw new Error("The server did not confirm session completion.");
      }

      sessionCompletionSucceededRef.current = true;
      sessionDeadlineReachedRef.current = true;
      if (sessionTimerRef.current !== null) {
        window.clearInterval(sessionTimerRef.current);
        sessionTimerRef.current = null;
      }
      navigate("/gd-report", { state: { session: data.session } });
    } catch (error) {
      console.error("Error ending GD session:", error);
      const message = error instanceof Error
        ? error.message
        : "Could not end the GD session. Please try again.";
      if (automatic) {
        setSpeechMessage(`${message} Use End GD to retry completion.`);
      } else {
        alert(message);
      }
    } finally {
      isFinalizingSpeechRef.current = false;
      isEndingRef.current = false;
      setIsEnding(false);
    }
  };

  const handleEndGD = async () => {
    if (!session || isEndingRef.current) return;

    const confirmEnd = window.confirm(
      "Are you sure you want to end this GD session?"
    );
    if (!confirmEnd) return;

    await completeGDSession(false);
  };

  useEffect(() => {
    completeSessionHandlerRef.current = () => {
      void completeGDSession(true);
    };
  });

  useEffect(() => {
    if (!roomSessionId || !Number.isFinite(selectedDurationSeconds)) return;

    if (
      sessionTimerIdRef.current !== roomSessionId ||
      sessionDeadlineRef.current === null
    ) {
      sessionTimerIdRef.current = roomSessionId;
      sessionDeadlineRef.current =
        Date.now() + Math.max(0, selectedDurationSeconds) * 60_000;
      sessionDeadlineReachedRef.current = false;
      sessionCompletionSucceededRef.current = false;
    }

    const timerId = window.setInterval(() => {
      if (sessionDeadlineRef.current === null) return;

      const secondsRemaining = Math.max(
        0,
        Math.ceil((sessionDeadlineRef.current - Date.now()) / 1000)
      );
      setSessionTimerDisplay((current) =>
        current.sessionId === roomSessionId && current.seconds === secondsRemaining
          ? current
          : { sessionId: roomSessionId, seconds: secondsRemaining }
      );

      if (secondsRemaining === 0 && !sessionDeadlineReachedRef.current) {
        sessionDeadlineReachedRef.current = true;
        setExpiredSessionId(roomSessionId);
        if (sessionTimerRef.current !== null) {
          window.clearInterval(sessionTimerRef.current);
          sessionTimerRef.current = null;
        }
        completeSessionHandlerRef.current?.();
      }
    }, 1000);

    sessionTimerRef.current = timerId;
    return () => {
      window.clearInterval(timerId);
      if (sessionTimerRef.current === timerId) sessionTimerRef.current = null;
    };
  }, [roomSessionId, selectedDurationSeconds, initialSessionSeconds]);

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

            <div className="rounded-xl border border-white/10 bg-slate-900 px-4 py-3">
              <p className="text-xs text-slate-500">Time Remaining</p>

              <p className="mt-1 text-sm font-semibold tabular-nums" role="timer" aria-live="off">
                {formatSessionCountdown(sessionSecondsRemaining)}
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

            {aiResponseErrors.analytical && (
              <div className="mt-4 text-sm text-red-400">
                <p>{aiResponseErrors.analytical}</p>
                <button
                  onClick={() => void getAIResponse("analytical", latestUserMessageId)}
                  disabled={!latestUserMessageId || isAIResponding || isSavingTurn || isEnding}
                  className="mt-2 font-semibold text-white underline disabled:opacity-50"
                >
                  Retry
                </button>
              </div>
            )}
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

            {aiResponseErrors.critical && (
              <div className="mt-4 text-sm text-red-400">
                <p>{aiResponseErrors.critical}</p>
                <button
                  onClick={() => void getAIResponse("critical", latestUserMessageId)}
                  disabled={!latestUserMessageId || isAIResponding || isSavingTurn || isEnding}
                  className="mt-2 font-semibold text-white underline disabled:opacity-50"
                >
                  Retry
                </button>
              </div>
            )}
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

            {aiResponseErrors.supportive && (
              <div className="mt-4 text-sm text-red-400">
                <p>{aiResponseErrors.supportive}</p>
                <button
                  onClick={() => void getAIResponse("supportive", latestUserMessageId)}
                  disabled={!latestUserMessageId || isAIResponding || isSavingTurn || isEnding}
                  className="mt-2 font-semibold text-white underline disabled:opacity-50"
                >
                  Retry
                </button>
              </div>
            )}
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

            {(speechMessage || !speechRecognitionSupported) && (
              <p className="mt-3 text-sm text-red-400" role="status">
                {speechMessage ||
                  "Speech recognition is not supported in this browser. Try Chrome or another browser that supports speech recognition."}
              </p>
            )}

            {responseWindowSeconds !== null && !isEnding && (
              <p className="mt-3 text-sm text-sky-300" role="status" aria-live="polite">
                {responseWindowHasNextAI
                  ? `Next participant responds in ${responseWindowSeconds} seconds. Speak now to interrupt.`
                  : `All participants have responded. Speak within ${responseWindowSeconds} seconds to continue.`}
              </p>
            )}

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
              disabled={isEnding || isSavingTurn || sessionTimeExpired}
              className={`mt-6 rounded-xl px-7 py-3.5 font-semibold transition ${
                isListening
                  ? "bg-red-500 text-white hover:bg-red-400"
                  : "bg-white text-slate-950 hover:bg-slate-200"
              } disabled:cursor-not-allowed disabled:opacity-60`}
            >
              {isListening
                ? "Stop Speaking"
                : isSavingTurn
                  ? "Saving Turn..."
                : transcript && !turnSaved
                  ? "Finish Turn"
                  : isAIResponding || responseWindowSeconds !== null
                    ? "Interrupt & Speak"
                    : "Speak Now"}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}

export default GDRoom;
