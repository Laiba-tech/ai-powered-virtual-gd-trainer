const mongoose = require("mongoose");

const gdMessageSchema = new mongoose.Schema(
  {
    sessionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "GDSession",
      required: true,
    },

    replyToMessageId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "GDMessage",
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

gdMessageSchema.index(
  { sessionId: 1, replyToMessageId: 1, participant: 1 },
  {
    unique: true,
    partialFilterExpression: {
      speaker: "ai",
      replyToMessageId: { $type: "objectId" },
    },
  }
);

const GDMessage = mongoose.model("GDMessage", gdMessageSchema);

module.exports = GDMessage;
