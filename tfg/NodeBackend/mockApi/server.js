import express from "express";
import cors from "cors";
import { brands, models, insurances, vehicles, services } from "./data.js";

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

/* =========================
   GET ENDPOINTS
========================= */

app.get("/api/brands", (req, res) => {
  setTimeout(() => res.json(brands), 300);
});

app.get("/api/models", (req, res) => {
  const { brandId } = req.query;

  setTimeout(() => {
    if (brandId) {
      const filtered = models.filter((m) => m.brandId === Number(brandId));
      return res.json(filtered);
    }
    res.json(models);
  }, 300);
});

app.get("/api/insurances", (req, res) => {
  setTimeout(() => res.json(insurances), 300);
});

app.get("/api/services", (req, res) => {
  setTimeout(() => {
    if (!services.length) {
      return res.status(404).json({ message: "No hay servicios" });
    }
    res.json(services);
  }, 300);
});

app.get("/api/vehicles", (req, res) => {
  const result = vehicles.map((vehicle) => {
    const brand = brands.find((b) => b.id == vehicle.brandId);
    const model = models.find((m) => m.id == vehicle.modelId);
    const insurance = insurances.find((i) => i.id == vehicle.insuranceId);

    return {
      ...vehicle,
      brandName: brand?.name || "",
      modelName: model?.name || "",
      insuranceName: insurance?.name || "",
    };
  });

  res.json(result);
});

app.get("/api/vehicle/:userId/:id", (req, res) => {
  const { userId, id } = req.params;

  const vehicle = vehicles.find((v) => v.id == id && v.userId == userId);

  if (!vehicle) {
    return res.status(404).json({ message: "Vehículo no encontrado" });
  }

  const brand = brands.find((b) => b.id == vehicle.brandId);
  const model = models.find((m) => m.id == vehicle.modelId);
  const insurance = insurances.find((i) => i.id == vehicle.insuranceId);

  res.json({
    ...vehicle,
    brandName: brand?.name || "",
    modelName: model?.name || "",
    insuranceName: insurance?.name || "",
  });
});

/* =========================
   POST VEHICLE
========================= */

app.post("/api/vehicles", (req, res) => {
  const { userId, brandId, modelId, plate } = req.body;

  if (!userId || !brandId || !modelId || !plate) {
    return res.status(400).json({ message: "Faltan campos" });
  }

  const newVehicle = {
    id: vehicles.length + 1,
    userId: Number(userId),
    brandId: Number(brandId),
    modelId: Number(modelId),
    plate,
    status: "Disponible",
    facturas: { totalGlobalAnyo: 0, historial: [] },
    gastoGasolina: { totalUltimoMes: 0, historial: [] },
  };

  vehicles.push(newVehicle);
  res.status(201).json(newVehicle);
});

/* =========================
   POST FACTURAS
========================= */

app.post("/api/vehicle/:userId/:vehicleId/facturas", (req, res) => {
  const { userId, vehicleId } = req.params;
  const { serviceId, name, total, date } = req.body;

  if (!serviceId || !total || !date) {
    return res.status(400).json({ message: "Faltan campos" });
  }

  const vehicle = vehicles.find((v) => v.id == vehicleId && v.userId == userId);

  if (!vehicle) {
    return res.status(404).json({ message: "Vehículo no encontrado" });
  }

  if (!vehicle.facturas) {
    vehicle.facturas = { totalGlobalAnyo: 0, historial: [] };
  }

  const newFactura = {
    id: vehicle.facturas.historial.length + 1,
    serviceId: Number(serviceId),
    name,
    total: Number(total),
    date,
  };

  vehicle.facturas.historial.push(newFactura);

  vehicle.facturas.totalGlobalAnyo = vehicle.facturas.historial.reduce(
    (acc, f) => acc + f.total,
    0,
  );

  res.status(201).json(newFactura);
});

/* =========================
   POST GASOIL
========================= */

app.post("/api/vehicle/:userId/:vehicleId/gasoil", (req, res) => {
  const { userId, vehicleId } = req.params;
  const { litros, monto, date } = req.body;

  // 🔥 SOLO monto obligatorio
  if (!monto) {
    return res.status(400).json({
      message: "El monto es obligatorio",
    });
  }

  const vehicle = vehicles.find((v) => v.id == vehicleId && v.userId == userId);

  if (!vehicle) {
    return res.status(404).json({
      message: "Vehículo no encontrado",
    });
  }

  if (!vehicle.gastoGasolina) {
    vehicle.gastoGasolina = {
      totalUltimoMes: 0,
      historial: [],
    };
  }

  // 👇 FECHA POR DEFECTO HOY
  const finalDate = date || new Date().toISOString().split("T")[0];

  const newGasoil = {
    id: vehicle.gastoGasolina.historial.length + 1,
    litros: litros ? Number(litros) : null,
    monto: Number(monto),
    date: finalDate,
  };

  vehicle.gastoGasolina.historial.push(newGasoil);

  // 🔥 total del mes
  const now = new Date();

  vehicle.gastoGasolina.totalUltimoMes = vehicle.gastoGasolina.historial
    .filter((g) => {
      const d = new Date(g.date);
      return (
        d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
      );
    })
    .reduce((acc, g) => acc + g.monto, 0);

  res.status(201).json(newGasoil);
});

/* ========================= */

app.listen(PORT, () => {
  console.log(`Mock API running on http://localhost:${PORT}`);
});
