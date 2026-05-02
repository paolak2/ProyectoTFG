const express = require("express");
const router = express.Router();
const controller = require("../controllers/vehiculos.controller");

router.get("/:usuario_id", controller.getVehiculos);
router.post("/", controller.createVehiculo);

module.exports = router;