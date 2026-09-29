const express = require("express");
const router = express.Router();
const ctrl = require("../controllers/hotelPicture.controller");
const authMiddleware = require("../middleware/auth.middleware");
const upload = require("../middleware/upload.middleware");

router.get("/", ctrl.getAll);
router.get("/:id", ctrl.getById);
router.post("/presigned-url", authMiddleware, ctrl.getPresignedUrl);
router.post("/", authMiddleware, upload.single("picture"), ctrl.create);
router.delete("/:id", authMiddleware, ctrl.remove);

module.exports = router;
