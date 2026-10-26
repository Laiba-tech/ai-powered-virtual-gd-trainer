
const SpeechSession = require("../models/SpeechSession");
const { generateHint } = require("../services/speakingHintService");
const { evaluateSpeech } = require("../services/speechAnalysisService");
const {
  generateAudienceReaction,
} = require("../services/audienceService");

const topics = [
  "Artificial Intelligence",
  "Social Media: Advantages and Disadvantages",
  "Importance of Communication Skills",
  "Climate Change",
  "The Future of Education",
  "Technology in Everyday Life",
];

function getUserId(req) {
  return req.userId || req.user?._id || req.user?.id;
}

async function getOwnedSession(req, sessionId) {
  const userId = getUserId(req);

  if (!userId) return null;

  return SpeechSession.findOne({
    _id: sessionId,
    user: userId,
  });
}

// Test controller
exports.testSpeaking = async (req, res) => {
  return res.json({
    message: "Speaking controller is working!",
  });
};

exports.getTopics = async (req, res) => {
  res.json({ topics });
};

exports.createSession = async (req, res) => {
  try {
    const userId = getUserId(req);
    const { topic, difficulty, duration } = req.body;

    if (!userId) {
      return res.status(401).json({ message: "Please log in." });
    }

    if (!topic || !topic.trim()) {
      return res.status(400).json({ message: "Topic is required." });
    }

    const session = await SpeechSession.create({
      user: userId,
      topic: topic.trim(),
      difficulty,
      duration,
    });

    return res.status(201).json({ session });
  } catch (error) {
    console.error("Create speech session error:", error.message);
    return res.status(500).json({
      message: "Could not create session.",
    });
  }
};

exports.evaluateSession = async (req, res) => {
  try {
    const session = await getOwnedSession(req, req.params.id);

    if (!session) {
      return res.status(404).json({
        message: "Session not found.",
      });
    }

    const { transcript, speakingSeconds } = req.body;

    if (typeof transcript !== "string" || !transcript.trim()) {
      return res.status(400).json({
        message: "Transcript is required.",
      });
    }

    if (transcript.length > 30000) {
      return res.status(413).json({
        message: "Transcript is too long.",
      });
    }

    const evaluation = await evaluateSpeech({
      topic: session.topic,
      transcript: transcript.trim(),
      difficulty: session.difficulty,
    });

    session.transcript = transcript.trim();
    session.speakingSeconds = Math.max(
      0,
      Number(speakingSeconds) || 0
    );
    session.overallScore = evaluation.overallScore;
    session.evaluation = evaluation;
    session.status = "completed";

    await session.save();

    return res.json({
      message: "Speech evaluated successfully.",
      session,
      evaluation,
    });
  } catch (error) {
    console.error("Speech evaluation error:", error.message);
    return res.status(502).json({
      message:
        "Could not evaluate speech. Check the Ollama service and model.",
    });
  }
};

exports.getHistory = async (req, res) => {
  try {
    const userId = getUserId(req);

    if (!userId) {
      return res.status(401).json({
        message: "Please log in.",
      });
    }

    const sessions = await SpeechSession.find({ user: userId })
      .sort({ createdAt: -1 })
      .select("topic difficulty duration overallScore status createdAt");

    return res.json({ sessions });
  } catch (error) {
    console.error("Speech history error:", error.message);
    return res.status(500).json({
      message: "Could not load history.",
    });
  }
};

exports.getSession = async (req, res) => {
  try {
    const session = await getOwnedSession(req, req.params.id);

    if (!session) {
      return res.status(404).json({
        message: "Session not found.",
      });
    }

    return res.json({ session });
  } catch (error) {
    console.error("Get speech session error:", error.message);
    return res.status(500).json({
      message: "Could not load session.",
    });
  }
};

exports.getAudienceReaction = async (req, res) => {
  try {
    const session = await getOwnedSession(req, req.params.id);

    if (!session) {
      return res.status(404).json({
        message: "Session not found.",
      });
    }

    const transcript = req.body.transcript || session.transcript;

    if (typeof transcript !== "string" || !transcript.trim()) {
      return res.status(400).json({
        message: "Speech text is required.",
      });
    }

    if (transcript.length > 10000) {
      return res.status(413).json({
        message: "Speech excerpt is too long.",
      });
    }

    const reaction = await generateAudienceReaction(
      transcript.trim()
    );

    session.audienceReactions.push(reaction);
    await session.save();

    return res.json({ reaction });
  } catch (error) {
    console.error("Audience generation error:", error.message);
    return res.status(502).json({
      message: "Could not generate an audience response.",
    });
  }
};
exports.getHint = async (req, res) => {
  try {
    const { topic, transcript = "" } = req.body;

    if (typeof topic !== "string" || !topic.trim()) {
      return res.status(400).json({
        message: "Please provide a topic."
      });
    }

    if (typeof transcript !== "string" || transcript.length > 10000) {
      return res.status(400).json({
        message: "Invalid or overly long transcript."
      });
    }

    const hint = generateHint(topic.trim(), transcript);

    return res.json({ hint });
  } catch (error) {
    console.error("Hint generation error:", error.message);

    return res.status(500).json({
      message: "Could not generate a hint."
    });
  }
};
