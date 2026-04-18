// routes/usuarios.js
const express = require('express');
const router  = express.Router();
const db      = require('../db');
const { verifyToken, requireRole } = require('../middleware/auth');

// POST /api/usuarios — Registro tras crear cuenta en Firebase
router.post('/', verifyToken, async (req, res) => {
  const { uid, email } = req.user;
  const { nombre, telefono, rol_id } = req.body;

  if (!nombre || !rol_id) {
    return res.status(400).json({ error: 'nombre y rol_id son obligatorios' });
  }

  try {
    // Evitar duplicados (Firebase puede llamar más de una vez)
    const [existe] = await db.query(
      'SELECT id FROM TBL_USUARIOS WHERE firebase_uid = ?', [uid]
    );
    if (existe.length) {
      return res.status(409).json({ error: 'El usuario ya existe en la base de datos' });
    }

    await db.query(
      `INSERT INTO TBL_USUARIOS (firebase_uid, Email, Nombre, Teléfono, rol_id, Estado, Fecha_creación)
       VALUES (?, ?, ?, ?, ?, 'activo', NOW())`,
      [uid, email, nombre, telefono || null, rol_id]
    );

    res.status(201).json({ message: 'Usuario registrado correctamente' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/usuarios/perfil — Perfil del usuario autenticado
router.get('/perfil', verifyToken, async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT u.id, u.Nombre, u.Email, u.Teléfono, u.Estado, u.Fecha_creación, r.Nombre as rol
       FROM TBL_USUARIOS u
       JOIN TBL_ROLES r ON u.rol_id = r.id
       WHERE u.firebase_uid = ?`,
      [req.user.uid]
    );
    if (!rows.length) return res.status(404).json({ error: 'Usuario no encontrado' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/usuarios — Listar todos (solo admin)
router.get('/', verifyToken, requireRole('admin_app'), async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT u.id, u.Nombre, u.Email, u.Teléfono, u.Estado, r.Nombre as rol
       FROM TBL_USUARIOS u JOIN TBL_ROLES r ON u.rol_id = r.id`
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/usuarios/:id — Actualizar estado/rol (solo admin)
router.patch('/:id', verifyToken, requireRole('admin_app'), async (req, res) => {
  const { Estado, rol_id } = req.body;
  try {
    await db.query(
      'UPDATE TBL_USUARIOS SET Estado = COALESCE(?, Estado), rol_id = COALESCE(?, rol_id) WHERE id = ?',
      [Estado, rol_id, req.params.id]
    );
    res.json({ message: 'Usuario actualizado' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
