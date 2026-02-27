const { verifyToken } = require('../utils/jwt');

const isAuthenticated = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: "No token provided. Please log in." });
  }

  const token = authHeader.substring(7);
  try {
    const decoded = verifyToken(token);
    req.user = decoded;
    return next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid token. Please log in again." });
  }
};

module.exports = { isAuthenticated };
