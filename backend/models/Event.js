const mongoose = require("mongoose");

const eventSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
    },
    theme: {
      type: String,
      default: "",
      trim: true,
    },
    category: {
      type: String,
      required: true,
      enum: [
        "Dance",
        "Music",
        "Fine Arts",
        "Literary",
        "Dramatics",
        "Informals"
      ],
    },
    date: {
      type: Date,
      required: true,
    },
    time: {
      type: String,
      default: "",
    },
    venue: {
      type: String,
      required: true,
    },
    maxParticipants: {
      type: Number,
      required: true,
      min: 1,
    },
    registeredCount: {
      type: Number,
      default: 0,
    },
    image: {
      url: { type: String, default: "" },
      publicId: { type: String, default: "" },
    },
    isListed: {
      type: Boolean,
      default: true,
    },
    participationType: {
      type: String,
      enum: ["solo", "group"],
      default: "solo",
    },
    teamSize: {
      min: { type: Number, default: 2 },
      max: { type: Number, default: 4 },
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Event", eventSchema);
