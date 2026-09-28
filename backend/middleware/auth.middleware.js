const jwt = require("jsonwebtoken");
const { sendError } = require("../utils/responseHelper");

const authMiddleware = (req, res, next) => {
  const token = req.headers.authorization?.replace("Bearer ", "");
  if (!token) return sendError(res, "No token provided", 401);

  try {
    // ---- DUMMY: attaches decoded payload; adjust claims to your login controller ----
    req.hotelAdmin = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch (err) {
    return sendError(res, "Invalid or expired token", 401);
  }
};

module.exports = authMiddleware;
