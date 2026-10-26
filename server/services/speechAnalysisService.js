const STOP_WORDS = new Set([
  "the", "a", "an", "is", "am", "are", "was", "were",
  "to", "of", "in", "on", "for", "and", "or", "but",
  "it", "this", "that", "i", "we", "you", "they",
  "he", "she", "with", "as", "at", "by", "be", "have",
  "has", "had", "do", "does", "did", "my", "our"
]);

function getWords(text) {
  return text.toLowerCase().match(/\b[a-z]+(?:'[a-z]+)?\b/g) || [];
}

function clamp(value, min = 0, max = 100) {
  return Math.max(min, Math.min(max, Math.round(value)));
}

async function evaluateSpeech({ topic, transcript, difficulty }) {
  const words = getWords(transcript);
  const sentences = transcript
    .split(/[.!?]+/)
    .map((sentence) => sentence.trim())
    .filter(Boolean);

  const wordCount = words.length;
  const fillerWords = words.filter((word) =>
    ["um", "uh", "erm", "basically", "actually", "like"].includes(word)
  ).length;

  const uniqueWords = new Set(words).size;
  const averageSentenceLength =
    sentences.length > 0 ? wordCount / sentences.length : 0;

  const topicWords = getWords(topic).filter(
    (word) => word.length > 2 && !STOP_WORDS.has(word)
  );

  const meaningfulWords = words.filter(
    (word) => word.length > 2 && !STOP_WORDS.has(word)
  );

  const matchedTopicWords = topicWords.filter((word) =>
    words.includes(word)
  ).length;

  const topicRelevance = topicWords.length
    ? clamp((matchedTopicWords / topicWords.length) * 70 + 20)
    : 50;

  const vocabulary = wordCount
    ? clamp((uniqueWords / wordCount) * 100)
    : 0;

  const clarity = wordCount
    ? clamp(
        85 -
        Math.max(0, averageSentenceLength - 25) * 1.5 -
        Math.max(0, 5 - averageSentenceLength) * 2
      )
    : 0;

  const fluency = wordCount
    ? clamp(90 - (fillerWords / wordCount) * 300)
    : 0;

  const structure = sentences.length >= 3
    ? 85
    : sentences.length === 2
      ? 70
      : sentences.length === 1
        ? 50
        : 0;

  const weights = {
    relevance: 0.30,
    clarity: 0.25,
    vocabulary: 0.15,
    fluency: 0.20,
    structure: 0.10
  };

  const overallScore = clamp(
    topicRelevance * weights.relevance +
    clarity * weights.clarity +
    vocabulary * weights.vocabulary +
    fluency * weights.fluency +
    structure * weights.structure
  );

  const feedback = [];

  if (topicRelevance < 50) {
    feedback.push("Connect your main points more directly to the topic.");
  }

  if (fillerWords > 3) {
    feedback.push("Reduce filler words and use short pauses instead.");
  }

  if (averageSentenceLength > 25) {
    feedback.push("Use shorter sentences to make your points easier to follow.");
  }

  if (sentences.length < 3) {
    feedback.push("Organize your response into an opening, main point, and conclusion.");
  }

  if (uniqueWords < 10) {
    feedback.push("Try adding relevant examples and more specific vocabulary.");
  }

  if (feedback.length === 0) {
    feedback.push("Good effort. Continue supporting your points with relevant examples.");
  }

  return {
    overallScore,
    criteria: {
      topicRelevance,
      clarity,
      vocabulary,
      fluency,
      structure
    },
    wordCount,
    fillerWords,
    feedback,
    difficulty: difficulty || "Beginner",
    scoringNote:
      "Text-based estimates only. Pace, pronunciation, and confidence require audio measurements."
  };
}

module.exports = { evaluateSpeech };