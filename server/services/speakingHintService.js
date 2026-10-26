function generateHint(topic, transcript = "") {
  const cleanTopic = (topic || "").trim();

  if (!cleanTopic) {
    return "Choose a topic first so I can help you.";
  }

  const wordCount = transcript.trim()
    ? transcript.trim().split(/\s+/).length
    : 0;

  if (wordCount === 0) {
    return `Start by explaining what "${cleanTopic}" means in your own words.`;
  }

  if (wordCount < 25) {
    return "Add one reason why this topic matters. Can you give a simple example?";
  }

  if (wordCount < 60) {
    return "Explain one advantage or disadvantage, and support it with an example.";
  }

  if (wordCount < 100) {
    return "Consider another point of view. What might someone disagree with, and why?";
  }

  return "Summarize your main argument and finish with a practical suggestion or conclusion.";
}

module.exports = { generateHint };