const jwt = require("jsonwebtoken");

function auth(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  if (!token) return res.status(401).json({ message: "Please log in first." });
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET || "dev_only_secret_change_me");
    next();
  } catch {
    return res.status(401).json({ message: "Your login has expired. Please log in again." });
  }
}

module.exports = auth;
