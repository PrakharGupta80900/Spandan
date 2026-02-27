const express = require("express");
const router = express.Router();
const { isAuthenticated } = require("../middleware/auth");
const User = require("../models/User");
const { generatePID } = require("../config/passport");
const { generateToken } = require("../utils/jwt");

// ── LOCAL SIGNUP ───────────────────────────────────────────
router.post("/signup", async (req, res) => {
  try {
    const { name, email, password, phone, college } = req.body;

    if (!name || !email || !password || !phone || !college) {
      return res.status(400).json({ error: "All fields are required: name, email, password, phone, and college" });
    }
    
    // Name validation - text only, min 2 characters
    if (!/^[a-zA-Z\s]+$/.test(name.trim())) {
      return res.status(400).json({ error: "Name can only contain letters and spaces" });
    }
    if (name.trim().length < 2) {
      return res.status(400).json({ error: "Name must be at least 2 characters long" });
    }
    
    // Phone validation - exactly 10 digits only (now required)
    if (!/^[0-9]{10}$/.test(phone.trim())) {
      return res.status(400).json({ error: "Phone number must be exactly 10 digits" });
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

    // Check if this email is admin
    const adminEmails = (process.env.ADMIN_EMAIL || "").split(",").map(e => e.trim().toLowerCase());
    const isAdmin = adminEmails.includes(email.toLowerCase().trim());

    const pid = await generatePID();
    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password,
      phone: phone.trim(),
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
      phone: user.phone,
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
      phone: user.phone,
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
  const { _id, name, email, avatar, pid, role, phone, college } = req.user;
  res.json({ _id, name, email, avatar, pid, role, phone, college });
});

// ── UPDATE PROFILE ────────────────────────────────────────
router.put("/profile", isAuthenticated, async (req, res) => {
  try {
    const { phone, college, name } = req.body;
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
    
    // Phone validation - exactly 10 digits only (now required)
    if (phone !== undefined) {
      if (!phone || !phone.trim()) {
        return res.status(400).json({ error: "Phone number is required" });
      }
      if (!/^[0-9]{10}$/.test(phone.trim())) {
        return res.status(400).json({ error: "Phone number must be exactly 10 digits" });
      }
      updateFields.phone = phone.trim();
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
    res.status(400).json({ error: err.message });
  }
});

// ── LOGOUT ────────────────────────────────────────────────
router.post("/logout", (req, res) => {
  // JWT is stateless, client handles token removal
  res.json({ message: "Logged out successfully" });
});

module.exports = router;
