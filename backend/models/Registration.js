const mongoose = require("mongoose");

const registrationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    event: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Event",
      required: true,
    },
    pid: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ["confirmed", "cancelled", "waitlisted"],
      default: "confirmed",
    },
    teamName: {
      type: String,
      default: "",
    },
    teamMembers: [
      {
        pid: { type: String, required: true },
        name: { type: String, default: "" },
        college: { type: String, default: "" },
      },
    ],
    tid: {
      type: String,
      unique: true,
      sparse: true,
    },
  },
  { timestamps: true }
);

// Prevent duplicate registrations
registrationSchema.index({ user: 1, event: 1 }, { unique: true });

// Auto-generate registration number & TID before saving
registrationSchema.pre("save", async function (next) {
  // Generate TID for group registrations
  if (this.teamName && !this.tid) {
    const lastTeamReg = await this.constructor
      .findOne({ tid: { $exists: true, $ne: null } })
      .sort({ tid: -1 })
      .select("tid");
    let nextNum = 1;
    if (lastTeamReg?.tid) {
      const num = parseInt(lastTeamReg.tid.replace("TID26", ""), 10);
      if (!isNaN(num)) nextNum = num + 1;
    }
    this.tid = `TID26${String(nextNum).padStart(4, "0")}`;
  }
  next();
});

module.exports = mongoose.model("Registration", registrationSchema);
