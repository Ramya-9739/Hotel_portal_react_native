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

// 3. External Discovery (Requires Admin auth; photo stream remains public for img tags)
router.get("/discover", authMiddleware, ctrl.discover);
router.get("/place-details/:placeId", authMiddleware, ctrl.getPlaceDetails);
router.get("/place-photo", ctrl.getPlacePhoto);

// 4. Protected Private Hotel Management Routes (Strict Ownership & Multi-Tenant Scoping)
router.get("/search", authMiddleware, ctrl.search);
router.get("/", authMiddleware, ctrl.getAll);
router.get("/:id", authMiddleware, ctrl.getById);
router.post("/", authMiddleware, ctrl.create);
router.put("/:id", authMiddleware, ctrl.update);
router.delete("/:id", authMiddleware, ctrl.remove);

module.exports = router;
