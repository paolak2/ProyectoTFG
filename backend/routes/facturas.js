// routes/facturas.js
const express = require('express');
const router  = express.Router();
const db      = require('../db');
const { verifyToken, requireRole } = require('../middleware/auth');

// GET /api/facturas — Facturas del usuario autenticado
router.get('/', verifyToken, async (req, res) => {
  try {
    const [uRows] = await db.query('SELECT id FROM TBL_USUARIOS WHERE firebase_uid = ?', [req.user.uid]);
    if (!uRows.length) return res.status(404).json({ error: 'Usuario no encontrado' });

    const [rows] = await db.query(
      `SELECT f.*, t.Nombre as taller, v.Matricula as vehiculo
       FROM TBL_FACTURAS f
       LEFT JOIN TBL_TALLERES t  ON f.taller_id = t.id
       LEFT JOIN TBL_VEHICULOS v ON f.vehiculo_id = v.id
       WHERE f.usuario_id = ?
       ORDER BY f.fecha_creacion DESC`,
      [uRows[0].id]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/facturas — Crear factura (taller)
router.post('/', verifyToken, requireRole('trabajador', 'admin_empresa', 'admin_app'), async (req, res) => {
  const { cita_id, usuario_id, vehiculo_id, taller_id, subtotal, iva, total } = req.body;
  try {
    const [result] = await db.query(
      `INSERT INTO TBL_FACTURAS (cita_id, usuario_id, vehiculo_id, taller_id, subtotal, iva, total, estado, fecha_creacion)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'pendiente', NOW())`,
      [cita_id, usuario_id, vehiculo_id, taller_id, subtotal, iva, total]
    );
    res.status(201).json({ id: result.insertId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/facturas/:id/pagar
router.patch('/:id/pagar', verifyToken, async (req, res) => {
  try {
    await db.query(
      "UPDATE TBL_FACTURAS SET estado = 'pagada', fecha_pago = NOW() WHERE id = ?",
      [req.params.id]
    );
    res.json({ message: 'Factura marcada como pagada' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;


// ────────────────────────────────────────────────────────────────────────────────
// routes/gastos.js
const routerGastos = express.Router();

// GET /api/gastos/vehiculo/:vehiculo_id
routerGastos.get('/vehiculo/:vehiculo_id', verifyToken, async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT g.*, tg.Nombre as tipo_gasto
       FROM TBL_GASTOS_VEHICULOS g
       LEFT JOIN TBL_TIPOS_GASTOS tg ON g.id_tipo = tg.id
       WHERE g.Vehiculo_id = ?
       ORDER BY g.Fecha_gasto DESC`,
      [req.params.vehiculo_id]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/gastos
routerGastos.post('/', verifyToken, async (req, res) => {
  const { Vehiculo_id, Monto, Descripcion, id_tipo, Fecha_gasto, factura_id } = req.body;
  try {
    const [result] = await db.query(
      `INSERT INTO TBL_GASTOS_VEHICULOS (Vehiculo_id, Monto, Descripcion, id_tipo, Fecha_gasto, Fecha_creacion, factura_id)
       VALUES (?, ?, ?, ?, ?, NOW(), ?)`,
      [Vehiculo_id, Monto, Descripcion, id_tipo, Fecha_gasto, factura_id || null]
    );
    res.status(201).json({ id: result.insertId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports.gastosRouter = routerGastos;
