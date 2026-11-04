const express = require("express");
const router = express.Router();
const ctrl = require("../controllers/hotelAdmin.controller");
const authMiddleware = require("../middleware/auth.middleware");
const { requireSuperAdmin } = require("../middleware/role.middleware");

router.post("/register", ctrl.register);
router.post("/superadmin-create", authMiddleware, requireSuperAdmin, ctrl.createBySuperAdmin);
router.post("/login", ctrl.login);
router.get("/", authMiddleware, requireSuperAdmin, ctrl.getAll);
router.get("/:id", authMiddleware, ctrl.getById);
router.put("/:id", authMiddleware, ctrl.update);
router.delete("/:id", authMiddleware, requireSuperAdmin, ctrl.remove);

module.exports = router;
