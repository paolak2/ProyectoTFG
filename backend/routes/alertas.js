// routes/alertas.js
const express = require('express');
const router  = express.Router();
const db      = require('../db');
const { verifyToken } = require('../middleware/auth');

// GET /api/alertas/vehiculo/:vehiculo_id
router.get('/vehiculo/:vehiculo_id', verifyToken, async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT a.*, ta.Nombre as tipo
       FROM TBL_ALERTAS a
       LEFT JOIN TBL_TIPOS_ALERTA ta ON a.tipo_alerta_id = ta.id
       WHERE a.Vehiculo_id = ?
       ORDER BY a.Fecha_creación DESC`,
      [req.params.vehiculo_id]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/alertas
router.post('/', verifyToken, async (req, res) => {
  const { Vehiculo_id, tipo_alerta_id, Descripción, Fecha_alerta } = req.body;
  try {
    const [result] = await db.query(
      `INSERT INTO TBL_ALERTAS (Vehiculo_id, tipo_alerta_id, Descripción, Fecha_creación, Estado, Fecha_alerta)
       VALUES (?, ?, ?, NOW(), 'activa', ?)`,
      [Vehiculo_id, tipo_alerta_id, Descripción, Fecha_alerta]
    );
    res.status(201).json({ id: result.insertId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/alertas/:id/estado
router.patch('/:id/estado', verifyToken, async (req, res) => {
  const { Estado } = req.body;
  try {
    await db.query('UPDATE TBL_ALERTAS SET Estado = ? WHERE id = ?', [Estado, req.params.id]);
    res.json({ message: 'Alerta actualizada' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
