const express = require("express");
const cors = require("cors");
const initDatabase = require("./initDatabase");

const app = express();

app.use(cors());
app.use(express.json());

// 🔹 Rutas
app.use("/api/usuarios", require("./routes/usuarios.routes"));
app.use("/api/talleres", require("./routes/talleres.routes"));
app.use("/api/vehiculos", require("./routes/vehiculos.routes"));
app.use("/api/reparaciones", require("./routes/reparaciones.routes"));

// 🔹 Arranque con inicialización de BD
const startServer = async () => {
  await initDatabase();

  app.listen(3000, () => {
    console.log("🚀 Servidor en http://localhost:3000");
  });
};

startServer();
