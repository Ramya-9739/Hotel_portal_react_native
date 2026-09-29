const express = require("express");
const router = express.Router();
const ctrl = require("../controllers/hotelProperty.controller");
const authMiddleware = require("../middleware/auth.middleware");

router.get("/", ctrl.getAll);
router.get("/:id", ctrl.getById);
router.post("/", authMiddleware, ctrl.create);
router.put("/:id", authMiddleware, ctrl.update);
router.delete("/:id", authMiddleware, ctrl.remove);

module.exports = router;
