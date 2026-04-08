import express from "express";
import cors from "cors";
import { brands, models, insurances, vehicles } from "./data.js";

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

app.get("/api/brands", (req, res) => {
  setTimeout(() => {
    res.json(brands);
  }, 400);
});

app.get("/api/models", (req, res) => {
  const { brandId } = req.query;

  setTimeout(() => {
    if (brandId) {
      const filteredModels = models.filter(
        (model) => model.brandId === Number(brandId),
      );
      return res.json(filteredModels);
    }

    res.json(models);
  }, 400);
});

app.get("/api/insurances", (req, res) => {
  setTimeout(() => {
    res.json(insurances);
  }, 400);
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

  const result = {
    ...vehicle,
    brandName: brand?.name || "",
    modelName: model?.name || "",
    insuranceName: insurance?.name || "",
  };

  res.json(result);
});

app.get("/api/vehicles", (req, res) => {
  const result = vehicles.map((vehicle) => {
    const brand = brands.find((b) => b.id === vehicle.brandId);
    const model = models.find((m) => m.id === vehicle.modelId);
    const insurance = insurances.find((i) => i.id === vehicle.aseguradoraId);

    return {
      ...vehicle,
      brandName: brand?.name,
      modelName: model?.name,
      insuranceName: insurance?.name,
    };
  });

  res.json(result);
});

app.post("/api/vehicles", (req, res) => {
  const {
    userId,
    brandId,
    modelId,
    insuranceId,
    insuranceNumber,
    plate,
    year,
    color,
    mileage,
    file,
  } = req.body;

  if (!userId || !brandId || !modelId || !plate) {
    return res.status(400).json({
      error: "Faltan campos obligatorios",
    });
  }

  const brandExists = brands.some((b) => b.id === Number(brandId));
  const modelExists = models.some((m) => m.id === Number(modelId));
  const insuranceExists = insurances.some((i) => i.id === Number(insuranceId));

  if (!brandExists || !modelExists) {
    return res.status(400).json({
      error: "Marca o modelo inválido",
    });
  }

  if (insuranceId && !insuranceExists) {
    return res.status(400).json({
      error: "Aseguradora inválida",
    });
  }

  const newVehicle = {
    id: vehicles.length + 1,
    userId: Number(userId),
    brandId: Number(brandId),
    modelId: Number(modelId),
    insuranceId: insuranceId ? Number(insuranceId) : null,
    insuranceNumber: insuranceNumber ? String(insuranceNumber) : null,
    plate,
    year,
    color,
    mileage,
    status: "Disponible",
    createdAt: new Date().toISOString(),
    ruta: null,
  };
  console.log(newVehicle);
  vehicles.push(newVehicle);

  res.status(201).json(newVehicle);
});

app.listen(PORT, () => {
  console.log(`Mock API running on http://localhost:${PORT}`);
});
