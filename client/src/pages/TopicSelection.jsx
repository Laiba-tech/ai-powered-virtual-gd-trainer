import { useState } from "react";
import { useNavigate } from "react-router-dom";

const predefinedTopics = [
  "Artificial Intelligence",
  "Social Media: Advantages and Disadvantages",
  "Importance of Communication Skills",
  "Climate Change",
  "The Future of Education",
  "Technology in Everyday Life",
];

export default function TopicSelection() {
  const navigate = useNavigate();
  const [selectedTopic, setSelectedTopic] = useState("");
  const [customTopic, setCustomTopic] = useState("");
  const [useCustomTopic, setUseCustomTopic] = useState(false);
  const [difficulty, setDifficulty] = useState("Beginner");
  const [duration, setDuration] = useState(2);

  const topic = useCustomTopic
    ? customTopic.trim()
    : selectedTopic;

  function handlePredefinedTopic(value) {
    setSelectedTopic(value);
    setCustomTopic("");
    setUseCustomTopic(false);
  }

  function handleCustomTopicChange(value) {
    setCustomTopic(value);
    setSelectedTopic("");
    setUseCustomTopic(true);
  }

  function handleSubmit(event) {
    event.preventDefault();

    if (!topic.trim()) {
      alert("Please select a topic or enter your own topic.");
      return;
    }

    sessionStorage.setItem("speakingTopic", topic);
    sessionStorage.setItem("speakingDifficulty", difficulty);
    sessionStorage.setItem("speakingDuration", String(duration));

    navigate("/speaking/practice", {
      state: { topic, difficulty, duration },
    });
  }

  return (
    <form className="speaking-page speaking-form" onSubmit={handleSubmit}>
      <h2>Choose Your Speaking Topic</h2>

      <label htmlFor="predefined-topic">Select a topic</label>
      <select
        id="predefined-topic"
        value={useCustomTopic ? "" : selectedTopic}
        onChange={(e) => handlePredefinedTopic(e.target.value)}
      >
        <option value="">-- None / Choose a topic --</option>
        {predefinedTopics.map((item) => (
          <option key={item} value={item}>
            {item}
          </option>
        ))}
      </select>

      <h3>Or enter your own topic</h3>

      <input
        type="text"
        value={customTopic}
        onChange={(e) => handleCustomTopicChange(e.target.value)}
        placeholder="Enter your own topic"
        maxLength={200}
      />

      <label htmlFor="difficulty">Difficulty</label>
      <select
        id="difficulty"
        value={difficulty}
        onChange={(e) => setDifficulty(e.target.value)}
      >
        <option>Beginner</option>
        <option>Intermediate</option>
        <option>Advanced</option>
      </select>

      <label htmlFor="duration">Practice duration (minutes)</label>
      <select
        id="duration"
        value={duration}
        onChange={(e) => setDuration(Number(e.target.value))}
      >
        <option value={1}>1 minute</option>
        <option value={2}>2 minutes</option>
        <option value={3}>3 minutes</option>
        <option value={5}>5 minutes</option>
      </select>

      <p>
        Selected topic: <strong>{topic || "None"}</strong>
      </p>

      <button type="submit">Start Practice</button>
    </form>
  );
}