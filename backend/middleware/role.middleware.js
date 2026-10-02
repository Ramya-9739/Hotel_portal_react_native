const { sendError } = require("../utils/responseHelper");

/**
 * Middleware to restrict endpoints exclusively to Super Admins.
 */
const requireSuperAdmin = (req, res, next) => {
  if (!req.hotelAdmin) {
    return sendError(res, "Authentication required", 401);
  }
  const role = String(req.hotelAdmin.role || "").toLowerCase();
  if (role !== "superadmin") {
    return sendError(res, "Forbidden: Super Admin privileges required", 403);
  }
  next();
};

module.exports = { requireSuperAdmin };
