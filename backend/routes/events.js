const express = require("express");
const router = express.Router();
const Event = require("../models/Event");
const Registration = require("../models/Registration");
const User = require("../models/User");
const { verifyToken } = require("../utils/jwt");
const { isAuthenticated } = require("../middleware/auth");

const getOptionalUser = async (req) => {
  const authHeader = req.headers.authorization || "";
  if (!authHeader.startsWith("Bearer ")) return null;

  try {
    const token = authHeader.substring(7);
    const decoded = verifyToken(token);
    const user = await User.findById(decoded._id).select("_id role isActive");
    if (!user || !user.isActive) return null;
    return user;
  } catch {
    return null;
  }
};

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
        { theme: { $regex: search, $options: "i" } },
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
    const maybeUser = await getOptionalUser(req);
    if (!event) return res.status(404).json({ error: "Event not found" });
    if (!event.isListed && maybeUser?.role !== "admin") {
      return res.status(403).json({ error: "Event is not available" });
    }
    res.json(event);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
