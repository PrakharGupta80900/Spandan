const mongoose = require("mongoose");

const ruleSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    // "general" = general instructions, "event" = event-specific rules
    type: {
      type: String,
      enum: ["general", "music", "literary", "dance", "fine-arts", "dramatics", "informal"],
      default: "general",
    },
    rules: {
      type: [String],
      default: [],
    },
    order: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Rule", ruleSchema);
