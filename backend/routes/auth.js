const express = require("express");
const router = express.Router();
const { isAuthenticated } = require("../middleware/auth");
const User = require("../models/User");
const { generatePID } = require("../config/passport");
const { generateToken } = require("../utils/jwt");

// ── LOCAL SIGNUP ───────────────────────────────────────────
router.post("/signup", async (req, res) => {
  try {
    const { name, email, password, rollNumber, college } = req.body;

    if (!name || !email || !password || !rollNumber || !college) {
      return res.status(400).json({ error: "All fields are required: name, email, password, roll number, and college" });
    }
    
    // Name validation - text only, min 2 characters
    if (!/^[a-zA-Z\s]+$/.test(name.trim())) {
      return res.status(400).json({ error: "Name can only contain letters and spaces" });
    }
    if (name.trim().length < 2) {
      return res.status(400).json({ error: "Name must be at least 2 characters long" });
    }
    
    // Roll number validation
    if (!/^[0-9]{1,30}$/.test(rollNumber.trim())) {
      return res.status(400).json({ error: "Roll number must contain only digits" });
    }
    
    // College validation - text only, min 2 characters
    if (!/^[a-zA-Z\s&]+$/.test(college.trim())) {
      return res.status(400).json({ error: "College name can only contain letters, spaces, and & symbol" });
    }
    if (college.trim().length < 2) {
      return res.status(400).json({ error: "College name must be at least 2 characters long" });
    }
    
    if (password.length < 6) {
      return res.status(400).json({ error: "Password must be at least 6 characters" });
    }

    // Check if email already exists
    const existing = await User.findOne({ email: email.toLowerCase().trim() });
    if (existing) {
      return res.status(400).json({ error: "An account with this email already exists" });
    }
    const existingRoll = await User.findOne({ rollNumber: rollNumber.trim() });
    if (existingRoll) {
      return res.status(400).json({ error: "An account with this roll number already exists" });
    }

    // Check if this email is admin
    const adminEmails = (process.env.ADMIN_EMAIL || "").split(",").map(e => e.trim().toLowerCase());
    const isAdmin = adminEmails.includes(email.toLowerCase().trim());

    const pid = await generatePID();
    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password,
      rollNumber: rollNumber.trim(),
      college: college.trim(),
      pid,
      role: isAdmin ? "admin" : "user",
      isVerified: true,
    });

    // Generate JWT token and return user data
    const payload = {
      _id: user._id,
      name: user.name,
      email: user.email,
      avatar: user.avatar,
      pid: user.pid,
      role: user.role,
      rollNumber: user.rollNumber,
      college: user.college,
    };
    const token = generateToken(payload);
    return res.status(201).json({ ...payload, token });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ── LOCAL LOGIN ────────────────────────────────────────────
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    if (!user.isActive) {
      return res.status(403).json({ error: "Account has been deactivated" });
    }

    // Generate JWT token and return user data
    const payload = {
      _id: user._id,
      name: user.name,
      email: user.email,
      avatar: user.avatar,
      pid: user.pid,
      role: user.role,
      rollNumber: user.rollNumber,
      college: user.college,
    };
    const token = generateToken(payload);
    return res.json({ ...payload, token });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── GET CURRENT USER ──────────────────────────────────────
router.get("/me", isAuthenticated, (req, res) => {
  const { _id, name, email, avatar, pid, role, rollNumber, college } = req.user;
  res.json({ _id, name, email, avatar, pid, role, rollNumber, college });
});

// ── UPDATE PROFILE ────────────────────────────────────────
router.put("/profile", isAuthenticated, async (req, res) => {
  try {
    const { rollNumber, college, name } = req.body;
    const updateFields = {};
    
    // Name validation - text only, min 2 characters
    if (name !== undefined) {
      if (!name || !name.trim()) {
        return res.status(400).json({ error: "Name is required" });
      }
      if (!/^[a-zA-Z\s]+$/.test(name.trim())) {
        return res.status(400).json({ error: "Name can only contain letters and spaces" });
      }
      if (name.trim().length < 2) {
        return res.status(400).json({ error: "Name must be at least 2 characters long" });
      }
      updateFields.name = name.trim();
    }
    
    // Roll number validation
    if (rollNumber !== undefined) {
      if (!rollNumber || !rollNumber.trim()) {
        return res.status(400).json({ error: "Roll number is required" });
      }
      if (!/^[0-9]{1,30}$/.test(rollNumber.trim())) {
        return res.status(400).json({ error: "Roll number must contain only digits" });
      }
      const normalizedRoll = rollNumber.trim();
      const duplicateRoll = await User.findOne({
        rollNumber: normalizedRoll,
        _id: { $ne: req.user._id },
      }).select("_id");
      if (duplicateRoll) {
        return res.status(400).json({ error: "An account with this roll number already exists" });
      }
      updateFields.rollNumber = normalizedRoll;
    }
    
    // College validation - text only, min 2 characters
    if (college !== undefined) {
      if (!college || !college.trim()) {
        return res.status(400).json({ error: "College is required" });
      }
      if (!/^[a-zA-Z\s&]+$/.test(college.trim())) {
        return res.status(400).json({ error: "College name can only contain letters, spaces, and & symbol" });
      }
      if (college.trim().length < 2) {
        return res.status(400).json({ error: "College name must be at least 2 characters long" });
      }
      updateFields.college = college.trim();
    }
    
    const updated = await User.findByIdAndUpdate(
      req.user._id,
      updateFields,
      { new: true, runValidators: true }
    ).select("-__v -password");
    res.json(updated);
  } catch (err) {
    if (err?.code === 11000) {
      if (err?.keyPattern?.email) {
        return res.status(400).json({ error: "An account with this email already exists" });
      }
      if (err?.keyPattern?.rollNumber) {
        return res.status(400).json({ error: "An account with this roll number already exists" });
      }
      return res.status(400).json({ error: "Duplicate value provided" });
    }
    res.status(400).json({ error: err.message });
  }
});

// ── LOGOUT ────────────────────────────────────────────────
router.post("/logout", (req, res) => {
  // JWT is stateless, client handles token removal
  res.json({ message: "Logged out successfully" });
});

module.exports = router;
