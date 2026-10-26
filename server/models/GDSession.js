const mongoose = require("mongoose");

const gdSessionSchema = new mongoose.Schema(
  {
    userId: {
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
      default: "Intermediate",
    },

    duration: {
      type: Number,
      required: true,
    },

    status: {
      type: String,
      enum: ["created", "in-progress", "completed"],
      default: "created",
    },

    startedAt: {
      type: Date,
    },

    endedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

const GDSession = mongoose.model("GDSession", gdSessionSchema);

module.exports = GDSession;