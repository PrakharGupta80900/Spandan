const express = require("express");
const router = express.Router();
const Rule = require("../models/Rule");
const { isAdmin } = require("../middleware/adminAuth");

// ── PUBLIC: Get all rule sections (sorted by order, then createdAt) ──────────
router.get("/", async (req, res) => {
  try {
    const rules = await Rule.find().sort({ order: 1, createdAt: 1 });
    res.json(rules);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch rules." });
  }
});

// ── ADMIN: Create a new rule section ─────────────────────────────────────────
router.post("/", isAdmin, async (req, res) => {
  try {
    const { title, type, rules, order } = req.body;
    if (!title || !title.trim()) {
      return res.status(400).json({ error: "Title is required." });
    }
    const rule = await Rule.create({
      title: title.trim(),
      type: type || "general",
      rules: Array.isArray(rules) ? rules.map((r) => r.trim()).filter(Boolean) : [],
      order: order ?? 0,
    });
    res.status(201).json(rule);
  } catch (err) {
    res.status(500).json({ error: "Failed to create rule section." });
  }
});

// ── ADMIN: Update a rule section ─────────────────────────────────────────────
router.put("/:id", isAdmin, async (req, res) => {
  try {
    const { title, type, rules, order } = req.body;
    const update = {};
    if (title !== undefined) update.title = title.trim();
    if (type !== undefined) update.type = type;
    if (rules !== undefined)
      update.rules = Array.isArray(rules)
        ? rules.map((r) => r.trim()).filter(Boolean)
        : [];
    if (order !== undefined) update.order = order;

    const rule = await Rule.findByIdAndUpdate(req.params.id, update, {
      new: true,
      runValidators: true,
    });
    if (!rule) return res.status(404).json({ error: "Rule section not found." });
    res.json(rule);
  } catch (err) {
    res.status(500).json({ error: "Failed to update rule section." });
  }
});

// ── ADMIN: Delete a rule section ─────────────────────────────────────────────
router.delete("/:id", isAdmin, async (req, res) => {
  try {
    const rule = await Rule.findByIdAndDelete(req.params.id);
    if (!rule) return res.status(404).json({ error: "Rule section not found." });
    res.json({ message: "Rule section deleted." });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete rule section." });
  }
});

module.exports = router;
