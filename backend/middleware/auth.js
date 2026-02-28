const { verifyToken } = require('../utils/jwt');
const User = require("../models/User");

const isAuthenticated = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: "No token provided. Please log in." });
  }

  const token = authHeader.substring(7);
  let decoded;
  try {
    decoded = verifyToken(token);
  } catch (err) {
    return res.status(401).json({ error: "Invalid token. Please log in again." });
  }

  try {
    const user = await User.findById(decoded._id).select("_id name email avatar pid role rollNumber college isActive");
    if (!user || !user.isActive) {
      return res.status(401).json({ error: "Session expired. Please log in again." });
    }
    req.user = user;
    return next();
  } catch (err) {
    return res.status(503).json({ error: "Authentication service unavailable. Please try again." });
  }
};

module.exports = { isAuthenticated };
