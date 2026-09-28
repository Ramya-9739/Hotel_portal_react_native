const express = require("express");
const router = express.Router();
const ctrl = require("../controllers/hotelAdmin.controller");
const authMiddleware = require("../middleware/auth.middleware");

router.post("/register", ctrl.register);
router.post("/login", ctrl.login);
router.get("/:id", authMiddleware, ctrl.getById);
router.put("/:id", authMiddleware, ctrl.update);
router.delete("/:id", authMiddleware, ctrl.remove);

module.exports = router;
