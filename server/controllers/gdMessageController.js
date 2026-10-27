const mongoose = require("mongoose");
const GDMessage = require("../models/GDMessage");
const GDSession = require("../models/GDSession");
const { generateAIResponse } = require("../services/ollamaService");

const addGDMessage = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { speaker, participant, text } = req.body;

    if (!speaker || !participant || !text || !text.trim()) {
      return res.status(400).json({
        message: "Please provide speaker, participant and text.",
      });
    }

    const session = await GDSession.findById(sessionId);

    if (!session) {
      return res.status(404).json({
        message: "GD session not found.",
      });
    }

    if (session.userId.toString() !== req.userId.toString()) {
      return res.status(403).json({
        message: "You are not authorized to access this session.",
      });
    }

    if (session.status === "completed") {
      return res.status(409).json({
        message: "Cannot add messages to a completed GD session.",
      });
    }

    const message = await GDMessage.create({
      sessionId,
      speaker,
      participant,
      text: text.trim(),
    });

    return res.status(201).json({
      message: "GD message added successfully.",
      data: message,
    });
  } catch (error) {
    console.error("Add GD message error:", error);
    return res.status(500).json({
      message: "Server error while adding GD message.",
    });
  }
};

const getGDMessages = async (req, res) => {
  try {
    const { sessionId } = req.params;

    const session = await GDSession.findById(sessionId);

    if (!session) {
      return res.status(404).json({
        message: "GD session not found.",
      });
    }

    if (session.userId.toString() !== req.userId.toString()) {
      return res.status(403).json({
        message: "You are not authorized to access this session.",
      });
    }

    const messages = await GDMessage.find({ sessionId }).sort({ timestamp: 1 });

    return res.status(200).json({
      message: "GD messages fetched successfully.",
      data: messages,
    });
  } catch (error) {
    console.error("Get GD messages error:", error);
    return res.status(500).json({
      message: "Server error while fetching GD messages.",
    });
  }
};

const generateAIMessage = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { participant, userMessageId } = req.body;

    if (!participant) {
      return res.status(400).json({
        message: "Please provide participant.",
      });
    }

    if (!["analytical", "critical", "supportive"].includes(participant)) {
      return res.status(400).json({
        message: "Invalid participant.",
      });
    }

    const session = await GDSession.findById(sessionId);

    if (!session) {
      return res.status(404).json({
        message: "GD session not found.",
      });
    }

    if (session.userId.toString() !== req.userId.toString()) {
      return res.status(403).json({
        message: "You are not authorized to access this session.",
      });
    }

    if (session.status === "completed") {
      return res.status(409).json({
        message: "Cannot generate responses for a completed GD session.",
      });
    }

    let targetMessageId = userMessageId;
    if (targetMessageId && !mongoose.Types.ObjectId.isValid(targetMessageId)) {
      return res.status(400).json({
        message: "Please provide a valid user message ID.",
      });
    }

    if (!targetMessageId) {
      const latestUserMessage = await GDMessage.findOne({
        sessionId,
        speaker: "user",
      }).sort({ timestamp: -1, _id: -1 });

      targetMessageId = latestUserMessage?._id;
    }

    if (!targetMessageId) {
      return res.status(400).json({
        message: "There is no user message in this GD session yet.",
      });
    }

    const recentMessages = await GDMessage.find({ sessionId })
      .sort({ timestamp: -1 })
      .limit(10);

    const conversationContext = recentMessages
      .slice()
      .reverse()
      .map((message) => {
        const speakerName = message.speaker === "user" ? "User" : message.participant;
        return `${speakerName}: ${message.text}`;
      })
      .join("\n");

    const prompt = `You are role-playing as a ${participant} participant in a group discussion about "${session.topic}". Keep your response concise, relevant, and natural. Respond as a speaking participant in a real-time discussion.\n\nConversation:\n${conversationContext || "No earlier messages yet."}`;

    const aiText = await generateAIResponse(prompt, {});

    const aiMessage = await GDMessage.create({
      sessionId,
      speaker: "ai",
      participant,
      text: aiText,
      replyToMessageId: targetMessageId || undefined,
    });

    return res.status(200).json({
      message: "AI response generated successfully.",
      data: aiMessage,
    });
  } catch (error) {
    console.error("Generate AI message error:", error);
    return res.status(502).json({
      message: "Could not generate AI response. Please try again.",
    });
  }
};

module.exports = {
  addGDMessage,
  getGDMessages,
  generateAIMessage,
};
