import express from "express";
import cors from "cors";
import {
  brands,
  models,
  insurances,
  vehicles,
  services,
  workshops,
  workshopUsers,
  workshopPanel,
  workshopChatMessages,
  workshopInvoices,
} from "./data.js";

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

app.get("/api", (req, res) => {
  res.json({
    message: "API mock funcionando",
    endpoints: [
      "/api/brands",
      "/api/models",
      "/api/insurances",
      "/api/services",
      "/api/vehicles",
      "/api/vehicle/:userId/:id",
      "/api/taller/session?role=admin|empleado",
      "/api/taller/panel",
      "/api/taller/chat",
      "/api/taller/facturacion",
      "/api/taller/ver-facturas",
    ],
  });
});

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

app.get("/api/workshops", (req, res) => {
  setTimeout(() => {
    if (!workshops.length) {
      return res.status(404).json({ message: "No hay talleres" });
    }

    const q = String(req.query.q ?? "")
      .trim()
      .toLowerCase();
    const service = String(req.query.service ?? "").trim();

    let list = workshops;

    if (service) {
      list = list.filter((w) => w.services?.includes(service));
    }

    if (q) {
      list = list.filter((w) => {
        const haystack = [
          w.name,
          w.address,
          w.status,
          w.phone,
          w.email,
          w.website,
        ]
          .join(" ")
          .toLowerCase();
        return haystack.includes(q);
      });
    }

    res.json(list);
  }, 300);
});

app.get("/api/taller/session", (req, res) => {
  const role = String(req.query.role ?? "admin");
  const sessionUser =
    workshopUsers.find((user) => user.role === role) ?? workshopUsers[0];

  setTimeout(() => {
    res.json(sessionUser);
  }, 300);
});

app.get("/api/taller/panel", (req, res) => {
  setTimeout(() => {
    res.json(workshopPanel);
  }, 300);
});

app.get("/api/taller/chat", (req, res) => {
  setTimeout(() => {
    res.json(workshopChatMessages);
  }, 300);
});

app.get("/api/taller/facturacion", (req, res) => {
  const role = String(req.query.role ?? "admin");
  if (role !== "admin") {
    return res
      .status(403)
      .json({ message: "Solo admin puede acceder a facturacion" });
  }

  const totalAmount = workshopInvoices.reduce((sum, invoice) => sum + invoice.total, 0);
  setTimeout(() => {
    res.json({ totalInvoices: workshopInvoices.length, totalAmount });
  }, 300);
});

app.get("/api/taller/ver-facturas", (req, res) => {
  const role = String(req.query.role ?? "empleado");
  if (role !== "empleado") {
    return res
      .status(403)
      .json({ message: "Solo empleado puede acceder a ver facturas" });
  }

  setTimeout(() => {
    res.json(workshopInvoices);
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

app.put("/api/vehicle/:userId/:id", (req, res) => {
  const { userId, id } = req.params;
  const vehicleIndex = vehicles.findIndex(
    (v) => v.id == id && v.userId == userId,
  );

  if (vehicleIndex === -1) {
    return res.status(404).json({ message: "Vehículo no encontrado" });
  }

  const {
    brandId,
    modelId,
    insuranceId,
    insuranceNumber,
    plate,
    year,
    color,
    mileage,
  } = req.body;

  if (!brandId || !modelId || !plate) {
    return res.status(400).json({
      error: "Faltan campos obligatorios",
    });
  }

  const brandExists = brands.some((b) => b.id === Number(brandId));
  const modelExists = models.some((m) => m.id === Number(modelId));
  const insuranceExists = insuranceId
    ? insurances.some((i) => i.id === Number(insuranceId))
    : true;

  if (!brandExists || !modelExists) {
    return res.status(400).json({
      error: "Marca o modelo inválido",
    });
  }

  if (!insuranceExists) {
    return res.status(400).json({
      error: "Aseguradora inválida",
    });
  }

  const updatedVehicle = {
    ...vehicles[vehicleIndex],
    brandId: Number(brandId),
    modelId: Number(modelId),
    insuranceId: insuranceId ? Number(insuranceId) : null,
    insuranceNumber: insuranceNumber ? String(insuranceNumber) : null,
    plate: String(plate).toUpperCase(),
    year,
    color,
    mileage: mileage !== undefined && mileage !== null ? Number(mileage) : null,
  };

  vehicles[vehicleIndex] = updatedVehicle;

  const brand = brands.find((b) => b.id === updatedVehicle.brandId);
  const model = models.find((m) => m.id === updatedVehicle.modelId);
  const insurance = insurances.find((i) => i.id === updatedVehicle.insuranceId);

  res.json({
    ...updatedVehicle,
    brandName: brand?.name || "",
    modelName: model?.name || "",
    insuranceName: insurance?.name || "",
  });
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
