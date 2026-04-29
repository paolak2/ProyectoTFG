const express = require("express");
const router = express.Router();
const controller = require("../controllers/reparaciones.controller");

router.post("/", controller.createReparacion);
router.get("/usuario/:id", controller.getByUsuario);
router.get("/taller/:id", controller.getByTaller);
router.put("/:id", controller.updateEstado);

module.exports = router;
