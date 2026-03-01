const express = require("express");
const router = express.Router();
const Registration = require("../models/Registration");
const Event = require("../models/Event");
const User = require("../models/User");
const { isAuthenticated } = require("../middleware/auth");

// Validate if a PID can be added to a group before submission
router.get("/pid/:pid/exists", isAuthenticated, async (req, res) => {
  try {
    const pid = String(req.params.pid || "").trim().toUpperCase();
    if (!pid) return res.status(400).json({ error: "PID is required" });
    if (pid === req.user.pid) {
      return res.status(400).json({ error: "You cannot add yourself as a team member" });
    }

    const found = await User.findOne({ pid, role: "user" }).select("pid name college");
    if (!found) return res.status(404).json({ error: "PID not found" });

    // Keep behavior consistent with registration-time constraints
    const leaderCollege = req.user.college || "";
    if ((found.college || "") !== leaderCollege) {
      return res.status(400).json({
        error: `Team member must be from the same college as the leader (${leaderCollege || "unspecified"})`,
      });
    }

    return res.json({ exists: true, user: { pid: found.pid, name: found.name, college: found.college || "" } });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// Rate-limit: one summary email per user every 10 minutes
const emailCooldowns = new Map();
const EMAIL_COOLDOWN_MS = 10 * 60 * 1000; // 10 minutes

// Email registration summary to the logged-in user
router.post("/email-summary", isAuthenticated, async (req, res) => {
  try {
    const userId = req.user._id.toString();
    const lastSent = emailCooldowns.get(userId);
    if (lastSent && Date.now() - lastSent < EMAIL_COOLDOWN_MS) {
      const minsLeft = Math.ceil((EMAIL_COOLDOWN_MS - (Date.now() - lastSent)) / 60000);
      return res.status(429).json({ error: `You can request another summary email in ${minsLeft} minute${minsLeft > 1 ? "s" : ""}` });
    }

    const { sendRegistrationsPdfEmail } = require("../utils/email");
    const registrations = await Registration.find({
      $or: [
        { user: req.user._id },
        { "teamMembers.pid": req.user.pid },
      ],
      status: { $ne: "cancelled" },
    })
      .populate("event", "title date venue")
      .sort({ createdAt: -1 });

    await sendRegistrationsPdfEmail({
      name: req.user.name,
      email: req.user.email,
      pid: req.user.pid,
      rollNumber: req.user.rollNumber,
      college: req.user.college,
      registrations: registrations.map((r) => r.toObject()),
    });

    emailCooldowns.set(userId, Date.now());
    res.json({ message: "Registration summary emailed successfully" });
  } catch (err) {
    res.status(500).json({ error: "Failed to send email" });
  }
});

// Register for an event
router.post("/:eventId", isAuthenticated, async (req, res) => {
  try {
    // Admins cannot register as participants
    if (req.user.role === "admin") {
      return res.status(403).json({ error: "Admins cannot register for events" });
    }

    const event = await Event.findById(req.params.eventId);
    if (!event) return res.status(404).json({ error: "Event not found" });
    if (!event.isListed) return res.status(400).json({ error: "Event is not open for registration" });
    // Check if event is full: each registration counts as 1 team slot
    const currentRegistrations = await Registration.countDocuments({ event: req.params.eventId, status: { $ne: "cancelled" } });
    if (currentRegistrations + 1 > event.maxParticipants) {
      const remaining = Math.max(event.maxParticipants - currentRegistrations, 0);
      return res.status(400).json({ error: `Not enough spots available. Event has ${remaining} slots remaining.` });
    }

    // Check if already registered
    const existing = await Registration.findOne({
      user: req.user._id,
      event: req.params.eventId,
    });
    if (existing) return res.status(400).json({ error: "Already registered for this event" });

    const regData = {
      user: req.user._id,
      event: req.params.eventId,
      pid: req.user.pid,
    };

    // Handle group events
    if (event.participationType === "group") {
      const { teamName, teamMembers } = req.body;
      if (!teamName || !teamName.trim()) {
        return res.status(400).json({ error: "Team name is required for group events" });
      }
      if (!teamMembers || !Array.isArray(teamMembers) || teamMembers.length === 0) {
        return res.status(400).json({ error: "At least one team member PID is required" });
      }

      const totalSize = teamMembers.length + 1; // +1 for the registrant
      if (totalSize < (event.teamSize?.min || 2)) {
        return res.status(400).json({ error: `Team must have at least ${event.teamSize?.min || 2} members (including you)` });
      }
      if (totalSize > (event.teamSize?.max || 4)) {
        return res.status(400).json({ error: `Team cannot exceed ${event.teamSize?.max || 4} members (including you)` });
      }

      // Validate all PIDs exist and are not admin
      const memberPIDs = teamMembers.map((m) => m.pid);
      if (memberPIDs.includes(req.user.pid)) {
        return res.status(400).json({ error: "You cannot add yourself as a team member" });
      }
      const uniquePIDs = [...new Set(memberPIDs)];
      if (uniquePIDs.length !== memberPIDs.length) {
        return res.status(400).json({ error: "Duplicate PIDs are not allowed" });
      }

      const foundUsers = await User.find({ pid: { $in: uniquePIDs }, role: "user" }).select("pid name college");
      if (foundUsers.length !== uniquePIDs.length) {
        const foundSet = new Set(foundUsers.map((u) => u.pid));
        const invalid = uniquePIDs.filter((p) => !foundSet.has(p));
        return res.status(400).json({ error: `Invalid PID(s): ${invalid.join(", ")}` });
      }

      // Enforce same college as leader
      const leaderCollege = req.user.college || "";
      const mismatched = foundUsers.filter((u) => (u.college || "") !== leaderCollege);
      if (mismatched.length > 0) {
        return res.status(400).json({ error: `All team members must be from the same college as the leader (${leaderCollege || "unspecified"}). Mismatched PID(s): ${mismatched.map((u) => u.pid).join(", ")}` });
      }

      regData.teamName = teamName.trim();
      regData.teamMembers = foundUsers.map((u) => ({ pid: u.pid, name: u.name, college: u.college || "" }));
    }

    const registration = await Registration.create(regData);

    // Increment registered count by 1 team slot
    await Event.findByIdAndUpdate(req.params.eventId, {
      $inc: { registeredCount: 1 },
    });

    await registration.populate("event", "title date time venue category image");

    res.status(201).json(registration);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ error: "Already registered for this event" });
    }
    res.status(500).json({ error: err.message });
  }
});

// Get my registrations
router.get("/my/all", isAuthenticated, async (req, res) => {
  try {
    const registrations = await Registration.find({
      $or: [
        { user: req.user._id },
        { "teamMembers.pid": req.user.pid },
      ],
      status: { $ne: "cancelled" },
    })
      .populate("event", "title date venue category image isListed")
      .sort({ createdAt: -1 });

    const result = registrations.map((reg) => {
      const isLeader = String(reg.user) === String(req.user._id);
      return {
        ...reg.toObject(),
        isLeader,
        canCancel: isLeader,
      };
    });

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Cancel registration
router.delete("/:eventId", isAuthenticated, async (req, res) => {
  try {
    const registration = await Registration.findOneAndDelete({
      user: req.user._id,
      event: req.params.eventId,
    });

    if (!registration) {
      return res.status(404).json({ error: "Registration not found" });
    }

    // Decrement by 1 team slot
    await Event.findByIdAndUpdate(req.params.eventId, {
      $inc: { registeredCount: -1 },
    });

    res.json({ message: "Registration cancelled successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

