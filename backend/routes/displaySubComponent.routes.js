const express = require("express");
const router = express.Router();
const ctrl = require("../controllers/displaySubComponent.controller");
const upload = require("../middleware/upload.middleware");
const { authMiddleware, optionalAuthMiddleware } = require("../middleware/auth.middleware");

// Endpoints with optional auth: authenticated owners receive scoped sub-components; guests receive approved hotel sub-components
router.get("/", optionalAuthMiddleware, ctrl.getAll);
router.get("/:id", optionalAuthMiddleware, ctrl.getById);

// Protected endpoints requiring authenticated admin
router.post("/", authMiddleware, upload.single("image"), ctrl.create);
router.put("/:id", authMiddleware, ctrl.update);
router.delete("/:id", authMiddleware, ctrl.remove);

module.exports = router;
