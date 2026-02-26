const isAdmin = (req, res, next) => {
  if (req.isAuthenticated() && req.user.role === "admin") {
    return next();
  }
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: "Not authenticated." });
  }
  return res.status(403).json({ error: "Access denied. Admins only." });
};

module.exports = { isAdmin };
