const db = require("../db");

exports.getTalleres = async (req, res) => {
  try {
    const [rows] = await db.query("SELECT * FROM talleres");
    res.json(rows);
  } catch {
    res.status(500).json({ error: "Error al obtener talleres" });
  }
};

exports.createTaller = async (req, res) => {
  const { nombre, direccion } = req.body;
  try {
    await db.query(
      "INSERT INTO talleres (nombre, direccion) VALUES (?, ?)",
      [nombre, direccion]
    );
    res.json({ message: "Taller creado" });
  } catch {
    res.status(500).json({ error: "Error al crear taller" });
  }
};