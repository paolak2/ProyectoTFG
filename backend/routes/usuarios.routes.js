const express = require("express");
const router = express.Router();
const controller = require("../controllers/usuarios.controller");

router.get("/", controller.getUsuarios);
router.post("/", controller.createUsuario);

module.exports = router;