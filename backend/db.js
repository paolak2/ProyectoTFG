// db.js — Pool de conexión a MySQL
const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
  host:     process.env.DB_HOST     || 'localhost',
  port:     process.env.DB_PORT     || 3306,
  user:     process.env.DB_USER     || 'root',
  password: process.env.DB_PASS     || 'password',
  database: process.env.DB_NAME     || 'bdvehiculos',
  waitForConnections: true,
  connectionLimit:    10,
  queueLimit:         0,
});

// Test de conexión al arrancar
pool.getConnection()
  .then(conn => {
    console.log('✅ Conexión a MySQL establecida correctamente.');
    conn.release();
  })
  .catch(err => {
    console.error('❌ Error al conectar con MySQL:', err.message);
    process.exit(1);
  });

module.exports = pool;
