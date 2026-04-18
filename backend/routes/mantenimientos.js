// routes/mantenimientos.js
const express = require('express');
const router  = express.Router();
const db      = require('../db');
const { verifyToken, requireRole } = require('../middleware/auth');

// GET /api/mantenimientos/vehiculo/:vehiculo_id
router.get('/vehiculo/:vehiculo_id', verifyToken, async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT m.*, t.Nombre as taller, em.Nombre as estado_mant
       FROM TBL_MANTENIMIENTO m
       LEFT JOIN TBL_TALLERES t                ON m.Taller_id = t.id
       LEFT JOIN TBL_ESTADOS_MANTENIMIENTO em  ON m.estado = em.Id
       WHERE m.vehiculo_id = ?
       ORDER BY m.fecha DESC`,
      [req.params.vehiculo_id]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/mantenimientos
router.post('/', verifyToken, requireRole('trabajador', 'admin_empresa', 'admin_app'), async (req, res) => {
  const { vehiculo_id, Tipo, Descripción, fecha, fecha_proxima, fecha_inicio, fecha_fin, fecha_fin_estimada, Taller_id, Cita_Id, estado, Observaciones } = req.body;

  try {
    const [result] = await db.query(
      `INSERT INTO TBL_MANTENIMIENTO
         (vehiculo_id, Tipo, Descripción, fecha, fecha_proxima, fecha_inicio, fecha_fin, fecha_fin_estimada, Taller_id, Cita_Id, estado, Observaciones)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [vehiculo_id, Tipo, Descripción, fecha, fecha_proxima, fecha_inicio, fecha_fin, fecha_fin_estimada, Taller_id, Cita_Id, estado || 1, Observaciones]
    );
    res.status(201).json({ id: result.insertId, message: 'Mantenimiento registrado' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/mantenimientos/:id/estado
router.patch('/:id/estado', verifyToken, requireRole('trabajador', 'admin_empresa', 'admin_app'), async (req, res) => {
  const { estado, fecha_fin } = req.body;
  try {
    await db.query(
      'UPDATE TBL_MANTENIMIENTO SET estado = COALESCE(?, estado), fecha_fin = COALESCE(?, fecha_fin) WHERE id = ?',
      [estado, fecha_fin, req.params.id]
    );
    res.json({ message: 'Mantenimiento actualizado' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
