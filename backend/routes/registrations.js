const express = require("express");
const router = express.Router();
const Registration = require("../models/Registration");
const Event = require("../models/Event");
const User = require("../models/User");
const { isAuthenticated } = require("../middleware/auth");
const { sendMail } = require("../utils/mailer");

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
    if (event.registeredCount >= event.maxParticipants) {
      return res.status(400).json({ error: "Event is full" });
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

    // Increment registered count
    await Event.findByIdAndUpdate(req.params.eventId, {
      $inc: { registeredCount: 1 },
    });

    await registration.populate("event", "title date venue category image");

    // Fire-and-forget registration email
    const eventDate = registration.event?.date
      ? new Date(registration.event.date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
      : "";
    sendMail({
      to: req.user.email,
      subject: `Registered for ${registration.event?.title || "event"}`,
      text: `Hi ${req.user.name || "Participant"},\n\nYour registration is confirmed.\nEvent: ${registration.event?.title || ""}\nCategory: ${registration.event?.category || ""}\nVenue: ${registration.event?.venue || ""}\nDate: ${eventDate}\nPID: ${req.user.pid}${registration.tid ? `\nTID: ${registration.tid}` : ""}${registration.teamName ? `\nTeam: ${registration.teamName}` : ""}\n\nSee you at the fest!\n\nPrakhar Gupta \nVice-President 2026`,
    }).catch(() => {});

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
      user: req.user._id,
      status: { $ne: "cancelled" },
    })
      .populate("event", "title date venue category image isListed")
      .sort({ createdAt: -1 });

    res.json(registrations);
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

    await Event.findByIdAndUpdate(req.params.eventId, {
      $inc: { registeredCount: -1 },
    });

    res.json({ message: "Registration cancelled successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
