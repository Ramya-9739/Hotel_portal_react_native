const express = require("express");
const router = express.Router();
const ctrl = require("../controllers/displaySubComponent.controller");
const upload = require("../middleware/upload.middleware");

router.get("/", ctrl.getAll);
router.get("/:id", ctrl.getById);
router.post("/", upload.single("image"), ctrl.create);
router.put("/:id", ctrl.update);
router.delete("/:id", ctrl.remove);

module.exports = router;
