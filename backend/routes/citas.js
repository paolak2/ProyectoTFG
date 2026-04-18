// routes/citas.js
const express = require('express');
const router  = express.Router();
const db      = require('../db');
const { verifyToken, requireRole } = require('../middleware/auth');

// GET /api/citas — Citas del usuario autenticado
router.get('/', verifyToken, async (req, res) => {
  try {
    const [uRows] = await db.query('SELECT id FROM TBL_USUARIOS WHERE firebase_uid = ?', [req.user.uid]);
    if (!uRows.length) return res.status(404).json({ error: 'Usuario no encontrado' });

    const [rows] = await db.query(
      `SELECT c.*, ec.Nombre as estado, t.Nombre as taller, s.Nombre as servicio,
              v.Matricula as vehiculo
       FROM TBL_CITA c
       LEFT JOIN TBL_ESTADOS_CITA ec ON c.estado_id = ec.id
       LEFT JOIN TBL_TALLERES t      ON c.taller_id = t.id
       LEFT JOIN TBL_SERVICIOS s     ON c.servicio_id = s.id
       LEFT JOIN TBL_VEHICULOS v     ON c.vehiculo_id = v.id
       WHERE c.usuario_id = ?
       ORDER BY c.fecha_cita DESC`,
      [uRows[0].id]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/citas/taller/:taller_id — Citas de un taller (trabajador/admin_empresa)
router.get('/taller/:taller_id', verifyToken, requireRole('trabajador', 'admin_empresa', 'admin_app'), async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT c.*, ec.Nombre as estado, u.Nombre as cliente, s.Nombre as servicio, v.Matricula
       FROM TBL_CITA c
       LEFT JOIN TBL_ESTADOS_CITA ec ON c.estado_id = ec.id
       LEFT JOIN TBL_USUARIOS u      ON c.usuario_id = u.id
       LEFT JOIN TBL_SERVICIOS s     ON c.servicio_id = s.id
       LEFT JOIN TBL_VEHICULOS v     ON c.vehiculo_id = v.id
       WHERE c.taller_id = ?
       ORDER BY c.fecha_cita DESC`,
      [req.params.taller_id]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/citas — Crear cita
router.post('/', verifyToken, async (req, res) => {
  const { vehiculo_id, servicio_id, taller_id, empleado_id, fecha_cita, notas } = req.body;

  if (!vehiculo_id || !servicio_id || !taller_id || !fecha_cita) {
    return res.status(400).json({ error: 'vehiculo_id, servicio_id, taller_id y fecha_cita son obligatorios' });
  }

  try {
    const [uRows] = await db.query('SELECT id FROM TBL_USUARIOS WHERE firebase_uid = ?', [req.user.uid]);
    if (!uRows.length) return res.status(404).json({ error: 'Usuario no encontrado' });

    // Estado inicial: pendiente (asumimos id=1)
    const [estadoRows] = await db.query("SELECT id FROM TBL_ESTADOS_CITA WHERE Nombre = 'pendiente' LIMIT 1");
    const estado_id = estadoRows.length ? estadoRows[0].id : 1;

    const [result] = await db.query(
      `INSERT INTO TBL_CITA (usuario_id, vehiculo_id, servicio_id, taller_id, empleado_id, fecha_cita, fecha_creacion, estado_id, notas)
       VALUES (?, ?, ?, ?, ?, ?, NOW(), ?, ?)`,
      [uRows[0].id, vehiculo_id, servicio_id, taller_id, empleado_id || null, fecha_cita, estado_id, notas || null]
    );
    res.status(201).json({ id: result.insertId, message: 'Cita creada correctamente' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/citas/:id/estado — Cambiar estado de una cita
router.patch('/:id/estado', verifyToken, requireRole('trabajador', 'admin_empresa', 'admin_app'), async (req, res) => {
  const { estado_id } = req.body;
  if (!estado_id) return res.status(400).json({ error: 'estado_id es obligatorio' });

  try {
    await db.query('UPDATE TBL_CITA SET estado_id = ? WHERE id = ?', [estado_id, req.params.id]);
    res.json({ message: 'Estado de cita actualizado' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
