const express = require("express");
const router = express.Router();
const ctrl = require("../controllers/hotelProperty.controller");
const authMiddleware = require("../middleware/auth.middleware");
const { requireSuperAdmin } = require("../middleware/role.middleware");

// 1. Public Guest Route (Only returns approved hotels from DB)
router.get("/public", ctrl.getPublic);

// 2. Super Admin Routes (Pending review queue & approval/rejection)
router.get("/pending", authMiddleware, requireSuperAdmin, ctrl.getPending);
router.patch("/:id/approve", authMiddleware, requireSuperAdmin, ctrl.approve);
router.patch("/:id/reject", authMiddleware, requireSuperAdmin, ctrl.reject);

// 3. Hotel Directory & Specific Item
router.get("/", ctrl.getAll);
router.get("/:id", ctrl.getById);

// 4. Hotel Owner & Super Admin Management Routes (with ownership enforcement)
router.post("/", authMiddleware, ctrl.create);
router.put("/:id", authMiddleware, ctrl.update);
router.delete("/:id", authMiddleware, ctrl.remove);

module.exports = router;
