const db = require("../db");

exports.getVehiculos = async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT * FROM vehiculos WHERE usuario_id = ?",
      [req.params.usuario_id]
    );
    res.json(rows);
  } catch {
    res.status(500).json({ error: "Error al obtener vehículos" });
  }
};

exports.createVehiculo = async (req, res) => {
  const { usuario_id, marca, modelo, matricula, anio } = req.body;
  try {
    await db.query(
      "INSERT INTO vehiculos (usuario_id, marca, modelo, matricula, anio) VALUES (?, ?, ?, ?, ?)",
      [usuario_id, marca, modelo, matricula, anio]
    );
    res.json({ message: "Vehículo creado" });
  } catch {
    res.status(500).json({ error: "Error al crear vehículo" });
  }
};