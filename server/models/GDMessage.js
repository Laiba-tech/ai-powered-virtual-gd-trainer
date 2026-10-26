const mongoose = require("mongoose");

const gdMessageSchema = new mongoose.Schema(
  {
    sessionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "GDSession",
      required: true,
    },

    speaker: {
      type: String,
      enum: ["user", "ai"],
      required: true,
    },

    participant: {
      type: String,
      enum: ["user", "analytical", "critical", "supportive"],
      required: true,
    },

    text: {
      type: String,
      required: true,
      trim: true,
    },

    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

const GDMessage = mongoose.model("GDMessage", gdMessageSchema);

module.exports = GDMessage;