const db = require("../db");

exports.getUsuarios = async (req, res) => {
  try {
    const [rows] = await db.query("SELECT id, nombre, email, rol FROM usuarios");
    res.json(rows);
  } catch {
    res.status(500).json({ error: "Error al obtener usuarios" });
  }
};

exports.createUsuario = async (req, res) => {
  const { uid, nombre, email, rol } = req.body;
  try {
    await db.query(
      "INSERT INTO usuarios (uid, nombre, email, rol) VALUES (?, ?, ?, ?)",
      [uid, nombre, email, rol]
    );
    res.json({ message: "Usuario creado" });
  } catch {
    res.status(500).json({ error: "Error al crear usuario" });
  }
};