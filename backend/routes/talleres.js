// routes/talleres.js
const express = require('express');
const router  = express.Router();
const db      = require('../db');
const { verifyToken, requireRole } = require('../middleware/auth');

// GET /api/talleres — Listar todos los talleres (público)
router.get('/', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM TBL_TALLERES');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/talleres/:id/servicios — Servicios de un taller
router.get('/:id/servicios', async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT ts.*, s.Nombre, s.tipo_servicio, s.Descripción, s.Duracion_aprox
       FROM TBL_TALLER_SERVICIOS ts
       JOIN TBL_SERVICIOS s ON ts.servicio_id = s.id
       WHERE ts.taller_id = ? AND ts.estado = 'activo'`,
      [req.params.id]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/talleres/:id/empleados
router.get('/:id/empleados', verifyToken, requireRole('admin_empresa', 'admin_app'), async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT * FROM TBL_TALLER_EMPLEADOS WHERE taller_id = ?',
      [req.params.id]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/talleres — Crear taller (admin_app)
router.post('/', verifyToken, requireRole('admin_app'), async (req, res) => {
  const { Nombre, Email, Teléfono, Ruta_web, Direccion, Ciudad } = req.body;
  try {
    const [result] = await db.query(
      'INSERT INTO TBL_TALLERES (Nombre, Email, Teléfono, Ruta_web, Direccion, Ciudad) VALUES (?, ?, ?, ?, ?, ?)',
      [Nombre, Email, Teléfono, Ruta_web, Direccion, Ciudad]
    );
    res.status(201).json({ id: result.insertId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
