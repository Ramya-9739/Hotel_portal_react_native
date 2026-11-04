const express = require("express");
const router = express.Router();
const ctrl = require("../controllers/displaySubComponent.controller");
const upload = require("../middleware/upload.middleware");
const authMiddleware = require("../middleware/auth.middleware");

// Public endpoints for guest showcase
router.get("/", ctrl.getAll);
router.get("/:id", ctrl.getById);

// Protected endpoints requiring authenticated admin
router.post("/", authMiddleware, upload.single("image"), ctrl.create);
router.put("/:id", authMiddleware, ctrl.update);
router.delete("/:id", authMiddleware, ctrl.remove);

module.exports = router;
