// =============================================================================
// backend/routes/touristDestination.routes.js
// Routes for Centralized Global Tourist Destinations (Super Admin Managed)
// =============================================================================

const express = require("express");
const router = express.Router();
const ctrl = require("../controllers/touristDestination.controller");
const authMiddleware = require("../middleware/auth.middleware");
const { requireSuperAdmin } = require("../middleware/role.middleware");

// 1. Public Guest Route (Unauthenticated, returns active destinations only)
router.get("/public", ctrl.getPublic);

// 2. Admin Directory Listing (Super Admin & Hotel Admin read access)
router.get("/admin", authMiddleware, ctrl.getAdminAll);
router.get("/", authMiddleware, ctrl.getAdminAll);
router.get("/:id", ctrl.getById);

// 3. Super Admin Exclusive Management Routes (Strict RBAC: 403 for clientadmin)
router.post("/", authMiddleware, requireSuperAdmin, ctrl.create);
router.put("/:id", authMiddleware, requireSuperAdmin, ctrl.update);
router.patch("/:id/status", authMiddleware, requireSuperAdmin, ctrl.toggleStatus);
router.delete("/:id", authMiddleware, requireSuperAdmin, ctrl.remove);

module.exports = router;

