const express = require("express");
const router = express.Router();
const cloudinary = require("cloudinary").v2;
const multer = require("multer");
const streamifier = require("streamifier");
const Event = require("../models/Event");
const User = require("../models/User");
const Registration = require("../models/Registration");
const { isAdmin } = require("../middleware/adminAuth");
const { sendMail } = require("../utils/mailer");

// Cloudinary Config
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Use memory storage + upload stream
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) cb(null, true);
    else cb(new Error("Only image files allowed"), false);
  },
});

function uploadToCloudinary(buffer) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: "spandan2026/events", transformation: [{ width: 1200, height: 630, crop: "limit" }] },
      (error, result) => { if (error) reject(error); else resolve(result); }
    );
    streamifier.createReadStream(buffer).pipe(stream);
  });
}

// ── ADMIN DASHBOARD STATS ──────────────────────────────────
router.get("/stats", isAdmin, async (req, res) => {
  try {
    const [totalEvents, listedEvents, totalUsers, totalRegistrations] =
      await Promise.all([
        Event.countDocuments(),
        Event.countDocuments({ isListed: true }),
        User.countDocuments({ role: "user" }),
        Registration.countDocuments({ status: "confirmed" }),
      ]);

    res.json({ totalEvents, listedEvents, totalUsers, totalRegistrations });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── GET ALL EVENTS (admin) ─────────────────────────────────
router.get("/events", isAdmin, async (req, res) => {
  try {
    const events = await Event.find().sort({ createdAt: -1 }).select("-__v");
    res.json(events);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── CREATE EVENT ───────────────────────────────────────────
router.post("/events", isAdmin, upload.single("image"), async (req, res) => {
  try {
    const {
      title, description, category, date, time,
      venue, maxParticipants, rules, coordinators,
      participationType, teamSize,
    } = req.body;

    const eventData = {
      title, description, category,
      date: new Date(date),
      time, venue,
      maxParticipants: parseInt(maxParticipants),
      participationType: participationType || "solo",
      rules: rules ? JSON.parse(rules) : [],
      coordinators: coordinators ? JSON.parse(coordinators) : [],
      createdBy: req.user._id,
    };

    if (participationType === "group" && teamSize) {
      const ts = typeof teamSize === "string" ? JSON.parse(teamSize) : teamSize;
      eventData.teamSize = { min: parseInt(ts.min) || 2, max: parseInt(ts.max) || 4 };
    }

    if (req.file) {
      const result = await uploadToCloudinary(req.file.buffer);
      eventData.image = { url: result.secure_url, publicId: result.public_id };
    }

    const event = await Event.create(eventData);
    res.status(201).json(event);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ── UPDATE EVENT ───────────────────────────────────────────
router.put("/events/:id", isAdmin, upload.single("image"), async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ error: "Event not found" });

    const {
      title, description, category, date, time,
      venue, maxParticipants, rules, coordinators,
      participationType, teamSize,
    } = req.body;

    const updateData = {
      title, description, category,
      date: date ? new Date(date) : event.date,
      time, venue,
      maxParticipants: maxParticipants ? parseInt(maxParticipants) : event.maxParticipants,
      participationType: participationType || event.participationType || "solo",
      rules: rules ? JSON.parse(rules) : event.rules,
      coordinators: coordinators ? JSON.parse(coordinators) : event.coordinators,
    };

    if ((participationType || event.participationType) === "group" && teamSize) {
      const ts = typeof teamSize === "string" ? JSON.parse(teamSize) : teamSize;
      updateData.teamSize = { min: parseInt(ts.min) || 2, max: parseInt(ts.max) || 4 };
    }

    if (req.file) {
      if (event.image?.publicId) await cloudinary.uploader.destroy(event.image.publicId);
      const result = await uploadToCloudinary(req.file.buffer);
      updateData.image = { url: result.secure_url, publicId: result.public_id };
    }

    const updated = await Event.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true,
    });

    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ── TOGGLE LIST/UNLIST EVENT ───────────────────────────────
router.patch("/events/:id/toggle", isAdmin, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ error: "Event not found" });

    event.isListed = !event.isListed;
    await event.save();
    res.json({ isListed: event.isListed, message: `Event ${event.isListed ? "listed" : "unlisted"} successfully` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── DELETE EVENT ───────────────────────────────────────────
router.delete("/events/:id", isAdmin, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ error: "Event not found" });

    if (event.image?.publicId) {
      await cloudinary.uploader.destroy(event.image.publicId);
    }

    await Registration.deleteMany({ event: req.params.id });
    await event.deleteOne();

    res.json({ message: "Event deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── GET REGISTRATIONS FOR AN EVENT ────────────────────────
router.get("/events/:id/registrations", isAdmin, async (req, res) => {
  try {
    const registrations = await Registration.find({ event: req.params.id })
      .populate("user", "name email pid phone college role")
      .sort({ createdAt: -1 });
    // Exclude admin registrations from the list
    const filtered = registrations.filter((r) => r.user?.role !== "admin");
    res.json(filtered);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── DELETE A REGISTRATION (ADMIN) ───────────────────────
router.delete("/registrations/:id", isAdmin, async (req, res) => {
  try {
    const registration = await Registration.findById(req.params.id);
    if (!registration) return res.status(404).json({ error: "Registration not found" });

    const eventId = registration.event;
    await registration.deleteOne();

    if (eventId) {
      await Event.findByIdAndUpdate(eventId, { $inc: { registeredCount: -1 } });
    }

    res.json({ message: "Registration deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── UPDATE A TEAM REGISTRATION (ADMIN) ──────────────────
router.patch("/registrations/:id", isAdmin, async (req, res) => {
  try {
    const { teamName } = req.body;
    const registration = await Registration.findById(req.params.id).populate("event").populate("user", "college pid");
    if (!registration) return res.status(404).json({ error: "Registration not found" });

    if (!registration.event) {
      return res.status(400).json({ error: "Registration is missing event context" });
    }
    if (registration.event.participationType !== "group") {
      return res.status(400).json({ error: "Only team registrations can be edited" });
    }
    if (!teamName || !teamName.trim()) {
      return res.status(400).json({ error: "Team name is required" });
    }

    registration.teamName = teamName.trim();
    await registration.save();

    res.json({ message: "Team updated", registration });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── GET ALL USERS ──────────────────────────────────────────
router.get("/users", isAdmin, async (req, res) => {
  try {
    const users = await User.find({ role: "user" })
      .select("-__v -googleId")
      .sort({ createdAt: -1 });
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── DELETE A USER (ADMIN) ─────────────────────────────────
router.delete("/users/:id", isAdmin, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: "User not found" });
    if (user.role === "admin") return res.status(400).json({ error: "Cannot delete admin accounts" });

    const registrations = await Registration.find({ user: req.params.id }).select("event");
    const eventCounts = registrations.reduce((acc, reg) => {
      if (reg.event) acc[reg.event] = (acc[reg.event] || 0) + 1;
      return acc;
    }, {});

    if (registrations.length > 0) {
      await Registration.deleteMany({ user: req.params.id });
      await Promise.all(
        Object.entries(eventCounts).map(([eventId, count]) =>
          Event.findByIdAndUpdate(eventId, { $inc: { registeredCount: -count } })
        )
      );
    }

    await user.deleteOne();
    // Fire-and-forget notification email
    sendMail({
      to: user.email,
      subject: "Your Spandan account has been deleted",
      text: `Hi ${user.name || "Participant"},\n\nYour account (PID: ${user.pid || ""}) has been deleted by an administrator.\nIf this was unexpected, please contact support.\nWith Regards\nPrakhar Gupta \nVice-President`,
    }).catch(() => {});

    res.json({ message: "User deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
