const express = require("express");
const router = express.Router();
const Notification = require("../models/Notification");
const { isAdmin } = require("../middleware/adminAuth");

// ── PUBLIC: Get all active notifications (sorted by order) ──────────────────
router.get("/", async (req, res) => {
  try {
    const notifications = await Notification.find({ active: true }).sort({ order: 1, createdAt: -1 });
    res.json(notifications);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch notifications." });
  }
});

// ── ADMIN: Get all notifications (including inactive) ────────────────────────
router.get("/all", isAdmin, async (req, res) => {
  try {
    const notifications = await Notification.find().sort({ order: 1, createdAt: -1 });
    res.json(notifications);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch notifications." });
  }
});

// ── ADMIN: Create a notification ─────────────────────────────────────────────
router.post("/", isAdmin, async (req, res) => {
  try {
    const { message, type, active, order } = req.body;
    if (!message || !message.trim()) {
      return res.status(400).json({ error: "Message is required." });
    }
    const notification = await Notification.create({
      message: message.trim(),
      type: type || "info",
      active: active !== undefined ? active : true,
      order: order ?? 0,
    });
    res.status(201).json(notification);
  } catch (err) {
    res.status(500).json({ error: "Failed to create notification." });
  }
});

// ── ADMIN: Update a notification ─────────────────────────────────────────────
router.put("/:id", isAdmin, async (req, res) => {
  try {
    const { message, type, active, order } = req.body;
    const update = {};
    if (message !== undefined) update.message = message.trim();
    if (type !== undefined) update.type = type;
    if (active !== undefined) update.active = active;
    if (order !== undefined) update.order = order;

    const notification = await Notification.findByIdAndUpdate(req.params.id, update, {
      new: true,
      runValidators: true,
    });
    if (!notification) return res.status(404).json({ error: "Notification not found." });
    res.json(notification);
  } catch (err) {
    res.status(500).json({ error: "Failed to update notification." });
  }
});

// ── ADMIN: Delete a notification ─────────────────────────────────────────────
router.delete("/:id", isAdmin, async (req, res) => {
  try {
    const notification = await Notification.findByIdAndDelete(req.params.id);
    if (!notification) return res.status(404).json({ error: "Notification not found." });
    res.json({ message: "Notification deleted." });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete notification." });
  }
});

module.exports = router;
