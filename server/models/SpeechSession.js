
const mongoose = require("mongoose");

const speechSessionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    topic: {
      type: String,
      required: true,
      trim: true,
    },

    difficulty: {
      type: String,
      enum: ["Beginner", "Intermediate", "Advanced"],
      default: "Beginner",
    },

    duration: {
      type: Number,
      default: 2,
    },

    speakingSeconds: {
      type: Number,
      default: 0,
    },

    transcript: {
      type: String,
      default: "",
    },

    overallScore: {
      type: Number,
      min: 0,
      max: 100,
      default: null,
    },

    evaluation: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },

    audienceReactions: [
      {
        type: String,
      },
    ],

    status: {
      type: String,
      enum: ["started", "completed"],
      default: "started",
    },

    // Added field: records when the session is completed
    completedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

module.exports =
  mongoose.models.SpeechSession ||
  mongoose.model("SpeechSession", speechSessionSchema);
