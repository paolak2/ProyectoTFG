const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

app.use("/api/usuarios", require("./routes/usuarios.routes"));
app.use("/api/talleres", require("./routes/talleres.routes"));
app.use("/api/vehiculos", require("./routes/vehiculos.routes"));
app.use("/api/reparaciones", require("./routes/reparaciones.routes"));

app.listen(3000, () => {
  console.log("Servidor en http://localhost:3000");
});
