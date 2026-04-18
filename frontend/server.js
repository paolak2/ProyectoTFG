// server.js — Punto de entrada de la API
require('dotenv').config();
const express = require('express');
const cors    = require('cors');

const app = express();

// ── Middlewares globales ─────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());

// ── Rutas ────────────────────────────────────────────────────────────────────
const usuariosRouter      = require('./routes/usuarios');
const vehiculosRouter     = require('./routes/vehiculos');
const citasRouter         = require('./routes/citas');
const mantenimientosRouter= require('./routes/mantenimientos');
const talleresRouter      = require('./routes/talleres');
const alertasRouter       = require('./routes/alertas');
const facturasRouter      = require('./routes/facturas');
const { gastosRouter }    = require('./routes/facturas');
const eventosRouter       = require('./routes/eventos');
const authRoutes          = require("./routes/auth");

app.use("/api",                authRoutes);
app.use('/api/usuarios',       usuariosRouter);
app.use('/api/vehiculos',      vehiculosRouter);
app.use('/api/citas',          citasRouter);
app.use('/api/mantenimientos', mantenimientosRouter);
app.use('/api/talleres',       talleresRouter);
app.use('/api/alertas',        alertasRouter);
app.use('/api/facturas',       facturasRouter);
app.use('/api/gastos',         gastosRouter);
app.use('/api/eventos',        eventosRouter);

// ── Health check ─────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ── Manejo de errores global ─────────────────────────────────────────────────
app.use((err, req, res, _next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Error interno del servidor' });
});

// ── Arranque ─────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`🚀 API arrancada en http://localhost:${PORT}`);
});
