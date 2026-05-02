const express = require("express");
const router = express.Router();
const controller = require("../controllers/talleres.controller");

router.get("/", controller.getTalleres);
router.post("/", controller.createTaller);

module.exports = router;