
import { useEffect, useState } from "react";

interface SpeechTimerProps {
  running: boolean;
  onTimeUpdate?: (seconds: number) => void;
}

export default function SpeechTimer({
  running,
  onTimeUpdate,
}: SpeechTimerProps) {
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    if (!running) return;

    const timer = window.setInterval(() => {
      setSeconds((previous) => {
        const next = previous + 1;
        onTimeUpdate?.(next);
        return next;
      });
    }, 1000);

    return () => window.clearInterval(timer);
  }, [running, onTimeUpdate]);

  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  return (
    <div className="speech-timer">
      <span>Speaking time</span>
      <h2>
        {String(minutes).padStart(2, "0")}:
        {String(remainingSeconds).padStart(2, "0")}
      </h2>
    </div>
  );
}
