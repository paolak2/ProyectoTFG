const db = require("../db");

exports.createReparacion = async (req, res) => {
  const { vehiculo_id, taller_id, usuario_id, descripcion } = req.body;
  try {
    await db.query(
      `INSERT INTO reparaciones 
      (vehiculo_id, taller_id, usuario_id, descripcion, fecha_inicio)
      VALUES (?, ?, ?, ?, NOW())`,
      [vehiculo_id, taller_id, usuario_id, descripcion]
    );
    res.json({ message: "Reparación creada" });
  } catch {
    res.status(500).json({ error: "Error al crear reparación" });
  }
};

exports.getByUsuario = async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT * FROM reparaciones WHERE usuario_id = ?",
      [req.params.id]
    );
    res.json(rows);
  } catch {
    res.status(500).json({ error: "Error al obtener reparaciones" });
  }
};

exports.getByTaller = async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT * FROM reparaciones WHERE taller_id = ?",
      [req.params.id]
    );
    res.json(rows);
  } catch {
    res.status(500).json({ error: "Error al obtener reparaciones" });
  }
};

exports.updateEstado = async (req, res) => {
  const { estado } = req.body;
  try {
    await db.query(
      "UPDATE reparaciones SET estado = ? WHERE id = ?",
      [estado, req.params.id]
    );
    res.json({ message: "Estado actualizado" });
  } catch {
    res.status(500).json({ error: "Error al actualizar estado" });
  }
};
