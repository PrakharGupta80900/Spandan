const express = require("express");
const router = express.Router();
const cloudinary = require("cloudinary").v2;
const multer = require("multer");
const streamifier = require("streamifier");
const Event = require("../models/Event");
const User = require("../models/User");
const Registration = require("../models/Registration");
const { isAdmin } = require("../middleware/adminAuth");

// Recompute registeredCount per event from active registrations
async function recomputeRegisteredCounts() {
  const counts = await Registration.aggregate([
    { $match: { status: { $ne: "cancelled" } } },
    { $group: { _id: "$event", total: { $sum: 1 } } },
  ]);

  const bulkOps = counts.map((c) => ({
    updateOne: {
      filter: { _id: c._id },
      update: { $set: { registeredCount: c.total } },
    },
  }));

  // reset events with zero
  const countedIds = new Set(counts.map((c) => String(c._id)));
  const allEvents = await Event.find({}, "_id");
  allEvents.forEach((e) => {
    if (!countedIds.has(String(e._id))) {
      bulkOps.push({
        updateOne: {
          filter: { _id: e._id },
          update: { $set: { registeredCount: 0 } },
        },
      });
    }
  });

  if (bulkOps.length) await Event.bulkWrite(bulkOps);
}

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
      (error, result) => {
        if (error) reject(error);
        else resolve(result);
      }
    );
    streamifier.createReadStream(buffer).pipe(stream);
  });
}

// ── ADMIN DASHBOARD STATS ──────────────────────────────────
router.get("/stats", isAdmin, async (req, res) => {
  try {
    // Ensure counts are fresh before reporting
    await recomputeRegisteredCounts();

    const [totalEvents, listedEvents, totalUsers, totalRegistrations] = await Promise.all([
      Event.countDocuments(),
      Event.countDocuments({ isListed: true }),
      User.countDocuments({ role: "user" }),
      Registration.countDocuments({ status: "confirmed" }),
    ]);

    res.set("Cache-Control", "no-store");
    res.json({ totalEvents, listedEvents, totalUsers, totalRegistrations });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── GET ALL USERS (admin) ────────────────────────────────
router.get("/users", isAdmin, async (req, res) => {
  try {
    const users = await User.find({ role: "user" })
      .select("-password -__v")
      .sort({ createdAt: -1 });
    const userIds = users.map((u) => u._id);
    const registrations = await Registration.find({
      user: { $in: userIds },
      status: { $ne: "cancelled" },
    })
      .populate("event", "title date time venue")
      .select("user event status teamName teamMembers pid tid createdAt")
      .sort({ createdAt: -1 });

    const registrationsByUser = registrations.reduce((acc, reg) => {
      const key = String(reg.user);
      if (!acc[key]) acc[key] = [];
      acc[key].push({
        _id: reg._id,
        status: reg.status,
        pid: reg.pid || "",
        teamName: reg.teamName || "",
        teamMembers: Array.isArray(reg.teamMembers) ? reg.teamMembers : [],
        tid: reg.tid || "",
        createdAt: reg.createdAt,
        event: reg.event
          ? {
              _id: reg.event._id,
              title: reg.event.title,
              date: reg.event.date,
              time: reg.event.time,
              venue: reg.event.venue,
            }
          : null,
      });
      return acc;
    }, {});

    const enrichedUsers = users.map((u) => {
      const user = u.toObject();
      user.registrations = registrationsByUser[String(u._id)] || [];
      return user;
    });

    res.set("Cache-Control", "no-store");
    res.json(enrichedUsers);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── DELETE USER (admin) ─────────────────────────────────
router.delete("/users/:id", isAdmin, async (req, res) => {
  try {
    const userId = req.params.id;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: "User not found" });
    if (user.role === "admin") return res.status(400).json({ error: "Cannot delete admin accounts" });

    // Collect this user's registrations to fix counts before deletion
    const registrations = await Registration.find({ user: userId }, "event");
    if (registrations.length) {
      const eventCountMap = registrations.reduce((acc, reg) => {
        const key = String(reg.event);
        acc[key] = (acc[key] || 0) + 1;
        return acc;
      }, {});

      const bulkEvents = Object.entries(eventCountMap).map(([eventId, count]) => ({
        updateOne: {
          filter: { _id: eventId },
          update: { $inc: { registeredCount: -count } },
        },
      }));
      if (bulkEvents.length) await Event.bulkWrite(bulkEvents);

      await Registration.deleteMany({ user: userId });
    }

    await user.deleteOne();
    res.json({ message: "User deleted" });
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
    const { title, description, theme, category, date, time, venue, maxParticipants, participationType, teamSize } = req.body;

    const eventData = {
      title,
      description,
      theme: participationType === "group" ? String(theme || "").trim() : "",
      category,
      date: new Date(date),
      time,
      venue,
      maxParticipants: parseInt(maxParticipants),
      participationType: participationType || "solo",
      createdBy: req.user._id,
    };

    if (participationType === "group" && teamSize) {
      const ts = typeof teamSize === "string" ? JSON.parse(teamSize) : teamSize;
      const min = parseInt(ts.min, 10);
      const max = parseInt(ts.max, 10);
      if (!Number.isFinite(min) || !Number.isFinite(max)) {
        return res.status(400).json({ error: "Invalid team size values" });
      }
      if (min < 2 || max < 2) {
        return res.status(400).json({ error: "Team size must be at least 2" });
      }
      if (min > max) {
        return res.status(400).json({ error: "Min team size cannot be greater than max team size" });
      }
      eventData.teamSize = { min, max };
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

    const { title, description, theme, category, date, time, venue, maxParticipants, participationType, teamSize } = req.body;
    const nextParticipationType = participationType || event.participationType || "solo";

    const updateData = {
      title,
      description,
      theme: nextParticipationType === "group"
        ? (theme !== undefined ? String(theme).trim() : event.theme || "")
        : "",
      category,
      date: date ? new Date(date) : event.date,
      time,
      venue,
      maxParticipants: maxParticipants ? parseInt(maxParticipants) : event.maxParticipants,
      participationType: nextParticipationType,
    };

    if ((participationType || event.participationType) === "group" && teamSize) {
      const ts = typeof teamSize === "string" ? JSON.parse(teamSize) : teamSize;
      const min = parseInt(ts.min, 10);
      const max = parseInt(ts.max, 10);
      if (!Number.isFinite(min) || !Number.isFinite(max)) {
        return res.status(400).json({ error: "Invalid team size values" });
      }
      if (min < 2 || max < 2) {
        return res.status(400).json({ error: "Team size must be at least 2" });
      }
      if (min > max) {
        return res.status(400).json({ error: "Min team size cannot be greater than max team size" });
      }
      updateData.teamSize = { min, max };
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
      .populate("user", "name email pid rollNumber college role")
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
    const registration = await Registration.findById(req.params.id).populate("event");
    if (!registration) return res.status(404).json({ error: "Registration not found" });

    const eventId = registration.event?._id;
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
    const registration = await Registration.findById(req.params.id).populate("event");
    if (!registration) return res.status(404).json({ error: "Registration not found" });

    if (!registration.event) {
      return res.status(400).json({ error: "Registration is missing event context" });
    }

    if (registration.event.participationType !== "group") {
      return res.status(400).json({ error: "Only group registrations can be updated" });
    }

    if (!teamName || !teamName.trim()) {
      return res.status(400).json({ error: "Team name is required" });
    }

    registration.teamName = teamName.trim();
    await registration.save();

    res.json({ message: "Registration updated", registration });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
