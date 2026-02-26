const express = require("express");
const router = express.Router();
const Event = require("../models/Event");
const Registration = require("../models/Registration");
const { isAuthenticated } = require("../middleware/auth");

// GET all listed events (public)
router.get("/", async (req, res) => {
  try {
    const { category, search } = req.query;
    const filter = { isListed: true };

    if (category && category !== "All") {
      filter.category = category;
    }

    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }

    const events = await Event.find(filter)
      .select("-__v -createdBy")
      .sort({ date: 1 });

    res.json(events);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET single event by ID (public)
router.get("/:id", async (req, res) => {
  try {
    const event = await Event.findById(req.params.id).select("-__v");
    if (!event) return res.status(404).json({ error: "Event not found" });
    if (!event.isListed && !(req.user?.role === "admin")) {
      return res.status(403).json({ error: "Event is not available" });
    }
    res.json(event);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
