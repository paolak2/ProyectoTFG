// routes/eventos.js
const express = require('express');
const router  = express.Router();
const db      = require('../db');
const { verifyToken } = require('../middleware/auth');

// GET /api/eventos — Eventos del usuario autenticado
router.get('/', verifyToken, async (req, res) => {
  try {
    const [uRows] = await db.query('SELECT id FROM TBL_USUARIOS WHERE firebase_uid = ?', [req.user.uid]);
    if (!uRows.length) return res.status(404).json({ error: 'Usuario no encontrado' });

    const [rows] = await db.query(
      `SELECT e.*, te.Descripción as tipo_evento, v.Matricula as vehiculo
       FROM TBL_EVENTOS e
       LEFT JOIN TBL_TIPO_EVENTO te ON e.Tipo_evento_id = te.id
       LEFT JOIN TBL_VEHICULOS v    ON e.Vehiculo_id = v.id
       WHERE e.Usuario_id = ?
       ORDER BY e.Fecha_inicio DESC`,
      [uRows[0].id]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/eventos
router.post('/', verifyToken, async (req, res) => {
  const { Vehiculo_id, Titulo, Descripcion, Tipo_evento_id, cita_id, Fecha_inicio, Fecha_fin } = req.body;
  try {
    const [uRows] = await db.query('SELECT id FROM TBL_USUARIOS WHERE firebase_uid = ?', [req.user.uid]);
    if (!uRows.length) return res.status(404).json({ error: 'Usuario no encontrado' });

    const [result] = await db.query(
      `INSERT INTO TBL_EVENTOS (Usuario_id, Vehiculo_id, Titulo, Descripcion, Tipo_evento_id, cita_id, Fecha_creacion, Fecha_inicio, Fecha_fin)
       VALUES (?, ?, ?, ?, ?, ?, NOW(), ?, ?)`,
      [uRows[0].id, Vehiculo_id, Titulo, Descripcion, Tipo_evento_id, cita_id || null, Fecha_inicio, Fecha_fin]
    );
    res.status(201).json({ id: result.insertId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/eventos/:id
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    await db.query('DELETE FROM TBL_EVENTOS WHERE id = ?', [req.params.id]);
    res.json({ message: 'Evento eliminado' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
