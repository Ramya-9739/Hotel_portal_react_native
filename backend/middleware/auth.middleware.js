const jwt = require("jsonwebtoken");
const { sendError } = require("../utils/responseHelper");

const authMiddleware = (req, res, next) => {
  const token = req.headers.authorization?.replace("Bearer ", "");
  if (!token) return sendError(res, "No token provided", 401);

  try {
    req.hotelAdmin = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch (err) {
    return sendError(res, "Invalid or expired token", 401);
  }
};

const optionalAuthMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.replace("Bearer ", "");
    try {
      req.hotelAdmin = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      // Invalid or expired token: continue as unauthenticated guest
    }
  }
  next();
};

module.exports = authMiddleware;
module.exports.authMiddleware = authMiddleware;
module.exports.optionalAuthMiddleware = optionalAuthMiddleware;
