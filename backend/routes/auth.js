const express = require("express");
const passport = require("passport");
const router = express.Router();
const { isAuthenticated } = require("../middleware/auth");
const User = require("../models/User");
const { generatePID } = require("../config/passport");
const { sendMail } = require("../utils/mailer");
const { generateToken } = require("../utils/jwt");

// ── LOCAL SIGNUP ───────────────────────────────────────────
router.post("/signup", async (req, res) => {
  try {
    const { name, email, password, phone, college, department, year } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: "Name, email and password are required" });
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
      phone: phone || "",
      college: college || "",
      department: department || "",
      year: year || "",
      pid,
      role: isAdmin ? "admin" : "user",
      isVerified: true,
    });

    // Fire-and-forget welcome email
    sendMail({
      to: user.email,
      subject: "Welcome to Spandan 2026",
      text: `Hi ${user.name},\n\nYour account has been created successfully.\nPID: ${user.pid}\n\nYou can now register for events.\n\nwith Regards\nPrakhar Gupta \nVice-President`,
    }).catch(() => {});

    // Generate JWT token and return user data
    const { _id, name, email, avatar, pid, role, phone, college, department, year } = user;
    const token = generateToken({ _id, name, email, avatar, pid, role, phone, college, department, year });
    return res.status(201).json({ _id, name, email, avatar, pid, role, phone, college, department, year, token });
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
      return res.status(401).json({ error: "Invalid email or password" });
    }

    if (!user.password) {
      return res.status(401).json({ error: "This account uses Google sign-in. Please use Google to log in." });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    if (!user.isActive) {
      return res.status(403).json({ error: "Account has been deactivated" });
    }

    // Generate JWT token and return user data
    const { _id, name, email, avatar, pid, role, phone, college, department, year } = user;
    const token = generateToken({ _id, name, email, avatar, pid, role, phone, college, department, year });
    return res.json({ _id, name, email, avatar, pid, role, phone, college, department, year, token });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── GOOGLE OAUTH (optional) ───────────────────────────────
router.get(
  "/google",
  passport.authenticate("google", {
    scope: ["profile", "email"],
    prompt: "select_account",
  })
);

router.get(
  "/google/callback",
  passport.authenticate("google", {
    failureRedirect: `${process.env.CLIENT_URL}/login?error=oauth_failed`,
  }),
  (req, res) => {
    res.redirect(
      `${process.env.CLIENT_URL}/auth/callback?status=success`
    );
  }
);

// ── GET CURRENT USER ──────────────────────────────────────
router.get("/me", isAuthenticated, (req, res) => {
  const { _id, name, email, avatar, pid, role, phone, college, department, year } =
    req.user;
  res.json({ _id, name, email, avatar, pid, role, phone, college, department, year });
});

// ── UPDATE PROFILE ────────────────────────────────────────
router.put("/profile", isAuthenticated, async (req, res) => {
  try {
    const { phone, college, department, year, name } = req.body;
    const updateFields = { phone, college, department, year };
    if (name && name.trim()) updateFields.name = name.trim();
    
    const updated = await User.findByIdAndUpdate(
      req.user._id,
      updateFields,
      { new: true, runValidators: true }
    ).select("-__v -googleId -password");
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
