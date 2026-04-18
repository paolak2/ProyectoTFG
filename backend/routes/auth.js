const express = require("express");
const router = express.Router();

const { verifyToken } = require("../middleware/auth");
const db = require("../db");

router.post("/usuarios", verifyToken, async (req, res) => {

  try {

    const { uid, email } = req.user;
    const { nombre, rol } = req.body;

    await db.query(
      `INSERT INTO usuarios (firebase_uid, email, nombre, rol)
       VALUES (?, ?, ?, ?)`,
      [uid, email, nombre, rol]
    );

    res.status(201).json({ message: "Usuario creado" });

  } catch (error) {

    res.status(500).json({ error: "Error creando usuario" });

  }

});

module.exports = router;