// 🔹 Inicializa la base de datos automáticamente al arrancar el servidor

const db = require("./db");

const initDatabase = async () => {
  try {
    console.log("🛠️ Inicializando base de datos...");

    // =========================
    // 👤 USUARIOS (adaptación)
    // =========================

    const [uidColumn] = await db.query("SHOW COLUMNS FROM usuarios LIKE 'uid'");
    if (uidColumn.length === 0) {
      await db.query("ALTER TABLE usuarios ADD uid VARCHAR(255)");
      console.log("✔ Columna uid añadida");
    }

    const [rolColumn] = await db.query("SHOW COLUMNS FROM usuarios LIKE 'rol'");
    if (rolColumn.length === 0) {
      await db.query(
        "ALTER TABLE usuarios ADD rol ENUM('cliente','empleado','jefe') DEFAULT 'cliente'"
      );
      console.log("✔ Columna rol añadida");
    }

    // =========================
    // 🚗 VEHÍCULOS
    // =========================

    await db.query(`
      CREATE TABLE IF NOT EXISTS vehiculos (
        id INT AUTO_INCREMENT PRIMARY KEY,
        usuario_id INT NOT NULL,
        marca VARCHAR(50),
        modelo VARCHAR(50),
        matricula VARCHAR(20),
        anio INT,
        FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
      )
    `);

    // =========================
    // 🔧 TALLERES (ampliación)
    // =========================

    const [dirColumn] = await db.query("SHOW COLUMNS FROM talleres LIKE 'direccion'");
    if (dirColumn.length === 0) {
      await db.query("ALTER TABLE talleres ADD direccion VARCHAR(255)");
      console.log("✔ Columna direccion añadida");
    }

    const [telColumn] = await db.query("SHOW COLUMNS FROM talleres LIKE 'telefono'");
    if (telColumn.length === 0) {
      await db.query("ALTER TABLE talleres ADD telefono VARCHAR(20)");
      console.log("✔ Columna telefono añadida");
    }

    // =========================
    // 👨‍🔧 EMPLEADOS
    // =========================

    await db.query(`
      CREATE TABLE IF NOT EXISTS empleados (
        id INT AUTO_INCREMENT PRIMARY KEY,
        usuario_id INT,
        taller_id INT,
        FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
        FOREIGN KEY (taller_id) REFERENCES talleres(id) ON DELETE CASCADE
      )
    `);

    // =========================
    // 🔩 REPARACIONES
    // =========================

    await db.query(`
      CREATE TABLE IF NOT EXISTS reparaciones (
        id INT AUTO_INCREMENT PRIMARY KEY,
        vehiculo_id INT NOT NULL,
        taller_id INT NOT NULL,
        usuario_id INT NOT NULL,
        descripcion TEXT,
        fecha_inicio DATETIME DEFAULT CURRENT_TIMESTAMP,
        fecha_fin DATETIME,
        estado ENUM('pendiente','en_proceso','finalizado') DEFAULT 'pendiente',
        FOREIGN KEY (vehiculo_id) REFERENCES vehiculos(id) ON DELETE CASCADE,
        FOREIGN KEY (taller_id) REFERENCES talleres(id) ON DELETE CASCADE,
        FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
      )
    `);

    // =========================
    // 🔗 RELACIÓN EMPLEADOS-REPARACIONES
    // =========================

    await db.query(`
      CREATE TABLE IF NOT EXISTS reparacion_empleados (
        id INT AUTO_INCREMENT PRIMARY KEY,
        reparacion_id INT,
        empleado_id INT,
        FOREIGN KEY (reparacion_id) REFERENCES reparaciones(id) ON DELETE CASCADE,
        FOREIGN KEY (empleado_id) REFERENCES empleados(id) ON DELETE CASCADE
      )
    `);

    // =========================
    // 📊 DATOS DE PRUEBA (solo si no existen)
    // =========================

    await db.query(`
      INSERT IGNORE INTO usuarios (id, nombre, email, rol)
      VALUES 
      (1, 'Cliente Demo', 'cliente@test.com', 'cliente'),
      (2, 'Empleado Demo', 'empleado@test.com', 'empleado'),
      (3, 'Jefe Demo', 'jefe@test.com', 'jefe')
    `);

    await db.query(`
      INSERT IGNORE INTO talleres (id, nombre, direccion)
      VALUES (1, 'Taller Central', 'Madrid')
    `);

    console.log("✅ Base de datos lista");
  } catch (error) {
    console.error("❌ Error inicializando la BD:", error);
  }
};

module.exports = initDatabase;
