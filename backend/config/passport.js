const mongoose = require("mongoose");

// Atomic counter document schema – one doc per year key e.g. "pid26"
const counterSchema = new mongoose.Schema(
  { _id: String, seq: { type: Number, default: 0 } },
  { collection: "pid_counters" }
);
const Counter = mongoose.models.PidCounter || mongoose.model("PidCounter", counterSchema);

// Generate PID atomically – no race conditions, single DB round-trip
async function generatePID() {
  const year = new Date().getFullYear().toString().slice(-2);
  const key = `pid${year}`;
  const counter = await Counter.findOneAndUpdate(
    { _id: key },
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );
  return `PID${year}${String(counter.seq).padStart(4, "0")}`;
}

module.exports = { generatePID };
