// routes/vehiculos.js
const express = require('express');
const router  = express.Router();
const db      = require('../db');
const { verifyToken } = require('../middleware/auth');

// GET /api/vehiculos — Vehículos del usuario autenticado
router.get('/', verifyToken, async (req, res) => {
  try {
    const [usuarioRows] = await db.query(
      'SELECT id FROM TBL_USUARIOS WHERE firebase_uid = ?', [req.user.uid]
    );
    if (!usuarioRows.length) return res.status(404).json({ error: 'Usuario no encontrado' });

    const usuario_id = usuarioRows[0].id;
    const [rows] = await db.query(
      `SELECT v.*, mc.Nombre as marca, mo.Nombre as modelo, a.Nombre as aseguradora
       FROM TBL_VEHICULOS v
       LEFT JOIN TBL_MARCAS_COCHES mc ON v.MarcaId = mc.Id
       LEFT JOIN TBL_MODELOS mo       ON v.ModeloId = mo.Id
       LEFT JOIN TBL_ASEGURADORAS a   ON v.aseguradoraId = a.Id
       WHERE v.Usuario_id = ?`,
      [usuario_id]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/vehiculos/:id — Detalle de un vehículo
router.get('/:id', verifyToken, async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT v.*, mc.Nombre as marca, mo.Nombre as modelo, a.Nombre as aseguradora
       FROM TBL_VEHICULOS v
       LEFT JOIN TBL_MARCAS_COCHES mc ON v.MarcaId = mc.Id
       LEFT JOIN TBL_MODELOS mo       ON v.ModeloId = mo.Id
       LEFT JOIN TBL_ASEGURADORAS a   ON v.aseguradoraId = a.Id
       WHERE v.id = ?`,
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Vehículo no encontrado' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/vehiculos — Crear vehículo
router.post('/', verifyToken, async (req, res) => {
  const { Matricula, MarcaId, ModeloId, anio_coche, color, Numero_poliza, aseguradoraId, ruta_imagen, kilometraje_actual, Estado_actual } = req.body;

  try {
    const [usuarioRows] = await db.query(
      'SELECT id FROM TBL_USUARIOS WHERE firebase_uid = ?', [req.user.uid]
    );
    if (!usuarioRows.length) return res.status(404).json({ error: 'Usuario no encontrado' });

    const [result] = await db.query(
      `INSERT INTO TBL_VEHICULOS
         (Usuario_id, Matricula, MarcaId, ModeloId, anio_coche, color, Numero_poliza, aseguradoraId, ruta_imagen, fecha_creacion, kilometraje_actual, Estado_actual)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), ?, ?)`,
      [usuarioRows[0].id, Matricula, MarcaId, ModeloId, anio_coche, color, Numero_poliza, aseguradoraId, ruta_imagen, kilometraje_actual, Estado_actual || 'disponible']
    );
    res.status(201).json({ id: result.insertId, message: 'Vehículo creado correctamente' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/vehiculos/:id — Actualizar vehículo
router.patch('/:id', verifyToken, async (req, res) => {
  const campos = ['Matricula', 'anio_coche', 'color', 'Numero_poliza', 'ruta_imagen', 'kilometraje_actual', 'Estado_actual'];
  const sets   = campos.filter(c => req.body[c] !== undefined).map(c => `${c} = ?`);
  const vals   = campos.filter(c => req.body[c] !== undefined).map(c => req.body[c]);

  if (!sets.length) return res.status(400).json({ error: 'No hay campos que actualizar' });

  try {
    await db.query(`UPDATE TBL_VEHICULOS SET ${sets.join(', ')} WHERE id = ?`, [...vals, req.params.id]);
    res.json({ message: 'Vehículo actualizado' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/vehiculos/:id
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    await db.query('DELETE FROM TBL_VEHICULOS WHERE id = ?', [req.params.id]);
    res.json({ message: 'Vehículo eliminado' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
