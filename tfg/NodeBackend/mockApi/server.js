import express from "express";
import cors from "cors";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import {
  brands,
  models,
  insurances,
  vehicles,
  services,
  workshops,
  accountSeeds,
  workshopStaff,
  workshopChatMessages,
  workshopInvoices,
  TALLER_VAT_RATE,
} from "./data.js";

const JWT_SECRET = process.env.JWT_SECRET || "autolink-dev-secret-tfg";

const accounts = accountSeeds.map(({ password, ...rest }) => ({
  ...rest,
  passwordHash: bcrypt.hashSync(password, 10),
}));

function accountById(id) {
  return accounts.find((a) => a.id === Number(id));
}

function findAccountByEmail(email) {
  const e = String(email ?? "").toLowerCase().trim();
  return accounts.find((a) => a.email.toLowerCase() === e);
}

function sanitizeAccount(acc) {
  if (!acc) {
    return null;
  }
  return {
    id: acc.id,
    email: acc.email,
    name: acc.name,
    phone: acc.phone,
    dni: acc.dni ?? null,
    role: acc.role,
    workshopId: acc.workshopId ?? null,
    staffId: acc.staffId ?? null,
    cif: acc.cif ?? null,
  };
}

function signJwt(acc) {
  return jwt.sign(
    {
      sub: acc.id,
      email: acc.email,
      role: acc.role,
      workshopId: acc.workshopId,
      staffId: acc.staffId ?? null,
      name: acc.name,
    },
    JWT_SECRET,
    { expiresIn: "7d" },
  );
}

function authMiddleware(req, res, next) {
  const raw = req.headers.authorization;
  const token = raw?.startsWith("Bearer ") ? raw.slice(7) : null;
  if (!token) {
    return res.status(401).json({ message: "No autorizado" });
  }
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    return next();
  } catch {
    return res.status(403).json({ message: "Sesión no válida" });
  }
}

function requireCliente(req, res, next) {
  if (req.user.role !== "cliente") {
    return res.status(403).json({ message: "Solo cuentas de cliente" });
  }
  return next();
}

function requireTallerStaff(req, res, next) {
  if (!["admin", "empleado"].includes(req.user.role)) {
    return res.status(403).json({ message: "Solo personal del taller" });
  }
  const wid = req.user.workshopId;
  if (wid == null || String(wid).trim() === "" || Number.isNaN(Number(wid))) {
    return res.status(403).json({
      message: "Esta cuenta no tiene un taller asignado",
    });
  }
  return next();
}

function requireTallerAdmin(req, res, next) {
  if (req.user.role !== "admin") {
    return res.status(403).json({ message: "Solo administradores del taller" });
  }
  return next();
}

const app = express();

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function isWorkshopPanelVehicle(v) {
  return (
    v.taller &&
    (v.status === "En Taller" || v.status === "Pendiente Recogida")
  );
}

function staffForWorkshop(workshopId) {
  const wid = Number(workshopId);
  return workshopStaff.filter((s) => Number(s.workshopId) === wid);
}

function roundMoney(n) {
  return Math.round(Number(n) * 100) / 100;
}

function tallerIssuer(req) {
  const acc = accountById(req.user.sub);
  const ws = workshops.find((w) => w.id === Number(req.user.workshopId));
  return {
    workshopName: ws?.name ?? "Taller",
    cif: acc?.cif ?? "",
  };
}

function invoicesForWorkshopMonth(wid, month, year) {
  return workshopInvoices.filter(
    (inv) =>
      Number(inv.workshopId) === Number(wid) &&
      inv.month === month &&
      inv.year === year,
  );
}

function summarizeWorkshopInvoices(list) {
  const emitidasCount = list.length;
  const totalImporteConIva = roundMoney(
    list.reduce((s, i) => s + i.totalWithVat, 0),
  );
  const pagadas = list.filter((i) => i.status === "paid");
  const pend = list.filter((i) => i.status === "pending");
  return {
    emitidasCount,
    totalImporteConIva,
    pagadasCount: pagadas.length,
    pagadasImporteConIva: roundMoney(
      pagadas.reduce((s, i) => s + i.totalWithVat, 0),
    ),
    porPagarCount: pend.length,
    porPagarImporteConIva: roundMoney(
      pend.reduce((s, i) => s + i.totalWithVat, 0),
    ),
  };
}

function normalizeInvoiceLines(rawLines) {
  if (!Array.isArray(rawLines) || rawLines.length === 0) {
    return null;
  }
  const out = [];
  for (const row of rawLines) {
    const qty = Math.max(1, Number(row.quantity) || 1);
    if (row.serviceId != null && row.serviceId !== "") {
      const sid = Number(row.serviceId);
      const svc = services.find((s) => s.id === sid);
      if (!svc) {
        return null;
      }
      const hasCustom =
        row.unitPriceExVat !== undefined &&
        row.unitPriceExVat !== null &&
        row.unitPriceExVat !== "";
      const unit = hasCustom
        ? roundMoney(row.unitPriceExVat)
        : roundMoney(svc.priceExVat);
      if (Number.isNaN(unit) || unit < 0) {
        return null;
      }
      out.push({
        serviceId: sid,
        name: svc.name,
        quantity: qty,
        unitPriceExVat: unit,
        lineTotalExVat: roundMoney(unit * qty),
      });
    } else {
      const name = String(row.name ?? "").trim();
      const unit = roundMoney(row.unitPriceExVat);
      if (!name || Number.isNaN(unit) || unit < 0) {
        return null;
      }
      out.push({
        serviceId: null,
        name,
        quantity: qty,
        unitPriceExVat: unit,
        lineTotalExVat: roundMoney(unit * qty),
      });
    }
  }
  return out;
}

function computeTotalsFromLines(lines, ivaRate) {
  const baseTotal = roundMoney(
    lines.reduce((s, l) => s + l.lineTotalExVat, 0),
  );
  const ivaAmount = roundMoney(baseTotal * ivaRate);
  const totalWithVat = roundMoney(baseTotal + ivaAmount);
  return { baseTotal, ivaAmount, totalWithVat };
}

function enrichWorkshopVehicle(vehicle) {
  const brand = brands.find((b) => b.id == vehicle.brandId);
  const model = models.find((m) => m.id == vehicle.modelId);
  const svc = vehicle.taller?.serviceId
    ? services.find((s) => s.id === vehicle.taller.serviceId)
    : null;
  const mechanic = vehicle.taller?.performedByStaffId
    ? workshopStaff.find((s) => s.id === vehicle.taller.performedByStaffId)
    : null;
  return {
    ...vehicle,
    brandName: brand?.name || "",
    modelName: model?.name || "",
    serviceName: svc?.name ?? vehicle.taller?.servicio ?? "",
    performedByName: mechanic?.name ?? null,
  };
}

function listVehiclesInTallerForWorkshop(wid) {
  const w = Number(wid);
  return vehicles
    .filter((v) => isWorkshopPanelVehicle(v) && Number(v.workshopId) === w)
    .map(enrichWorkshopVehicle);
}

function computeWorkshopPanelPayload(workshopId) {
  const wid = Number(workshopId);
  const workshop = workshops.find((w) => w.id === wid);
  const listed = vehicles.filter(
    (v) =>
      isWorkshopPanelVehicle(v) && Number(v.workshopId) === wid,
  );
  const today = todayISO();
  const activeOrders = listed.filter(
    (v) => v.taller.repairStatus === "en_curso",
  ).length;
  const waitingVehicles = listed.filter(
    (v) => v.taller.repairStatus === "en_espera",
  ).length;
  const deliveriesToday = listed.filter(
    (v) => v.taller.exitDate === today,
  ).length;

  return {
    workshopId: wid,
    workshopName: workshop?.name ?? "Taller",
    activeOrders,
    waitingVehicles,
    deliveriesToday,
    vehicles: listed.map(enrichWorkshopVehicle),
    staff: staffForWorkshop(workshopId),
    services,
  };
}

const CITA_RECHAZO_MENSAJE =
  "Lamentablemente no podemos atender tu solicitud en estos momentos.";

let nextAppointmentId = 1;
const appointmentRequests = [];

function findActiveAppointmentForVehicle(vehicleId) {
  return appointmentRequests.find(
    (r) =>
      r.vehicleId === vehicleId &&
      ["pending", "accepted", "scheduled"].includes(r.status),
  );
}

function enrichVehicleListItem(vehicle) {
  const brand = brands.find((b) => b.id == vehicle.brandId);
  const model = models.find((m) => m.id == vehicle.modelId);
  const insurance = insurances.find((i) => i.id == vehicle.insuranceId);
  const active = findActiveAppointmentForVehicle(vehicle.id);
  let solicitudCita = null;
  if (active) {
    if (active.status === "pending") {
      solicitudCita = { fase: "pendiente" };
    } else if (active.status === "accepted") {
      solicitudCita = { fase: "aceptada" };
    } else if (active.status === "scheduled") {
      solicitudCita = { fase: "programada" };
    }
  }
  return {
    ...vehicle,
    brandName: brand?.name || "",
    modelName: model?.name || "",
    insuranceName: insurance?.name || "",
    solicitudCita,
    citaRechazoMensaje: vehicle.citaRechazoMensaje ?? null,
    citaFechaEntrada:
      vehicle.status === "Cita programada"
        ? (vehicle.citaFechaEntrada ?? null)
        : null,
  };
}

function enrichAppointmentRequest(req) {
  const v = vehicles.find((x) => x.id === req.vehicleId);
  if (!v) {
    return { ...req };
  }
  const brand = brands.find((b) => b.id == v.brandId);
  const model = models.find((m) => m.id == v.modelId);
  const ws = workshops.find((w) => w.id === req.workshopId);
  return {
    ...req,
    vehiclePlate: v.plate,
    brandName: brand?.name || "",
    modelName: model?.name || "",
    ownerName: v.owner?.name ?? "",
    workshopName: ws?.name ?? "",
    scheduledExitDate: req.scheduledExitDate ?? null,
  };
}

const PORT = 3001;

app.use(cors());
app.use(express.json());

app.post("/api/auth/register", async (req, res) => {
  const {
    accountType,
    name,
    email,
    phone,
    password,
    dni,
    cif,
    workshopId,
  } = req.body ?? {};

  const mail = String(email ?? "").trim().toLowerCase();
  const pass = String(password ?? "");
  const nom = String(name ?? "").trim();
  const tel = String(phone ?? "").trim();

  if (!mail || !pass || !nom || !tel) {
    return res.status(400).json({ message: "Faltan campos obligatorios" });
  }
  if (findAccountByEmail(mail)) {
    return res.status(409).json({ message: "Ya existe una cuenta con ese email" });
  }

  const nextId = accounts.reduce((m, a) => Math.max(m, a.id), 0) + 1;
  const hash = await bcrypt.hash(pass, 10);

  if (accountType === "taller") {
    const wid = Number(workshopId);
    const cifVal = String(cif ?? "").trim();
    if (!wid || !cifVal) {
      return res
        .status(400)
        .json({ message: "Taller y CIF obligatorios para cuentas de empresa" });
    }
    if (!workshops.some((w) => w.id === wid)) {
      return res.status(400).json({ message: "Taller no válido" });
    }
    const acc = {
      id: nextId,
      email: mail,
      passwordHash: hash,
      name: nom,
      phone: tel,
      dni: dni ? String(dni).trim() : null,
      role: "admin",
      workshopId: wid,
      staffId: null,
      cif: cifVal,
    };
    accounts.push(acc);
    const token = signJwt(acc);
    return res.status(201).json({ token, user: sanitizeAccount(acc) });
  }

  if (accountType === "cliente" || !accountType) {
    const acc = {
      id: nextId,
      email: mail,
      passwordHash: hash,
      name: nom,
      phone: tel,
      dni: dni ? String(dni).trim() : null,
      role: "cliente",
      workshopId: null,
      staffId: null,
      cif: null,
    };
    accounts.push(acc);
    const token = signJwt(acc);
    return res.status(201).json({ token, user: sanitizeAccount(acc) });
  }

  return res.status(400).json({ message: "Tipo de cuenta no válido" });
});

app.post("/api/auth/login", async (req, res) => {
  const { email, password } = req.body ?? {};
  const acc = findAccountByEmail(email);
  if (!acc) {
    return res.status(401).json({ message: "Email o contraseña incorrectos" });
  }
  const ok = await bcrypt.compare(String(password ?? ""), acc.passwordHash);
  if (!ok) {
    return res.status(401).json({ message: "Email o contraseña incorrectos" });
  }
  const token = signJwt(acc);
  res.json({ token, user: sanitizeAccount(acc) });
});

app.get("/api/auth/me", authMiddleware, (req, res) => {
  const acc = accountById(req.user.sub);
  if (!acc) {
    return res.status(401).json({ message: "Usuario no encontrado" });
  }
  res.json(sanitizeAccount(acc));
});

app.get("/api/public/workshops", (req, res) => {
  res.json(
    workshops.map((w) => ({
      id: w.id,
      name: w.name,
      address: w.address,
    })),
  );
});

app.get("/api", (req, res) => {
  res.json({
    message: "API mock funcionando",
    endpoints: [
      "/api/brands",
      "/api/models",
      "/api/insurances",
      "POST /api/auth/login",
      "POST /api/auth/register",
      "GET /api/auth/me (Bearer)",
      "/api/public/workshops",
      "/api/services (Bearer cliente)",
      "/api/vehicles (Bearer cliente)",
      "/api/vehicle/:userId/:id",
      "DELETE /api/vehicle/:userId/:id",
      "/api/taller/panel",
      "PATCH /api/taller/ordenes/:vehicleId",
      "POST /api/taller/ordenes/:vehicleId/servicios",
      "/api/taller/chat",
      "/api/taller/facturacion?month=&year=",
      "/api/taller/facturacion/vehicles",
      "POST /api/taller/facturacion",
      "PATCH /api/taller/facturacion/:id/pagar",
      "/api/taller/ver-facturas",
      "POST /api/citas",
      "GET /api/taller/citas",
      "POST /api/taller/citas/manual (admin taller)",
      "PATCH /api/taller/citas/:id/aceptar",
      "PATCH /api/taller/citas/:id/rechazar",
      "PATCH /api/taller/citas/:id/asignar",
      "POST /api/taller/citas/:id/ingresar",
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

app.get("/api/services", authMiddleware, requireCliente, (req, res) => {
  setTimeout(() => {
    if (!services.length) {
      return res.status(404).json({ message: "No hay servicios" });
    }
    res.json(services);
  }, 300);
});

app.get("/api/workshops", authMiddleware, requireCliente, (req, res) => {
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

app.post("/api/citas", authMiddleware, requireCliente, (req, res) => {
  const { vehicleId, workshopId, comment } = req.body ?? {};
  const uid = Number(req.user.sub);
  const vid = Number(vehicleId);
  const wid = Number(workshopId);

  if (!vid || !wid) {
    return res.status(400).json({ message: "Faltan datos obligatorios" });
  }

  const vehicle = vehicles.find((v) => v.id === vid && v.userId === uid);
  if (!vehicle) {
    return res.status(404).json({ message: "Vehículo no encontrado" });
  }
  if (vehicle.status !== "Disponible") {
    return res
      .status(400)
      .json({ message: "Solo se puede solicitar cita si el vehículo está disponible" });
  }
  if (findActiveAppointmentForVehicle(vid)) {
    return res
      .status(409)
      .json({ message: "Ya existe una solicitud o cita activa para este vehículo" });
  }

  const ws = workshops.find((w) => w.id === wid);
  if (!ws) {
    return res.status(400).json({ message: "Taller no válido" });
  }

  vehicle.citaRechazoMensaje = null;

  const row = {
    id: nextAppointmentId++,
    vehicleId: vid,
    userId: uid,
    workshopId: wid,
    comment: String(comment ?? "").trim(),
    status: "pending",
    assignedStaffId: null,
    scheduledEntryDate: null,
    createdAt: new Date().toISOString(),
  };
  appointmentRequests.push(row);

  setTimeout(() => {
    res.status(201).json({
      appointment: enrichAppointmentRequest(row),
      vehicle: enrichVehicleListItem(vehicle),
    });
  }, 200);
});

app.get(
  "/api/taller/citas",
  authMiddleware,
  requireTallerStaff,
  requireTallerAdmin,
  (req, res) => {
    const wid = Number(req.user.workshopId);
    setTimeout(() => {
      const scoped = (r) => Number(r.workshopId) === wid;
      const nuevas = appointmentRequests
        .filter((r) => r.status === "pending" && scoped(r))
        .map(enrichAppointmentRequest);
      const proximas = appointmentRequests
        .filter(
          (r) =>
            ["accepted", "scheduled"].includes(r.status) && scoped(r),
        )
        .map(enrichAppointmentRequest);
      res.json({
        nuevas,
        proximas,
        staff: staffForWorkshop(req.user.workshopId),
        services,
      });
    }, 200);
  },
);

app.post(
  "/api/taller/citas/manual",
  authMiddleware,
  requireTallerStaff,
  requireTallerAdmin,
  (req, res) => {
    const wid = Number(req.user.workshopId);
    const {
      ownerName,
      plate,
      brandId,
      modelId,
      serviceId,
      scheduledEntryDate,
      scheduledExitDate,
      assignedStaffId,
    } = req.body ?? {};

    const nom = String(ownerName ?? "").trim();
    const plateNorm = String(plate ?? "").trim().toUpperCase();
    const entry = String(scheduledEntryDate ?? "").trim();
    const exitD = String(scheduledExitDate ?? "").trim();
    const bid = Number(brandId);
    const mid = Number(modelId);
    const svcId = Number(serviceId);
    const sid = Number(assignedStaffId);

    if (!nom || !plateNorm || !bid || !mid || !svcId || !entry || !exitD) {
      return res.status(400).json({ message: "Faltan campos obligatorios" });
    }
    if (!/^[A-Za-z0-9]{1,8}$/.test(plateNorm)) {
      return res.status(400).json({ message: "Matrícula no válida" });
    }
    if (vehicles.some((v) => String(v.plate).toUpperCase() === plateNorm)) {
      return res
        .status(409)
        .json({ message: "Ya existe un vehículo con esa matrícula" });
    }
    const modelRow = models.find((m) => m.id === mid);
    if (!brands.some((b) => b.id === bid) || !modelRow || modelRow.brandId !== bid) {
      return res.status(400).json({ message: "Marca o modelo no válidos" });
    }
    const svc = services.find((s) => s.id === svcId);
    if (!svc) {
      return res.status(400).json({ message: "Servicio no válido" });
    }
    const staffOk = staffForWorkshop(wid).some((s) => s.id === sid);
    if (!sid || !staffOk) {
      return res.status(400).json({ message: "Empleado asignado no válido" });
    }
    if (new Date(exitD) < new Date(entry)) {
      return res.status(400).json({
        message: "La fecha de salida debe ser igual o posterior a la de ingreso",
      });
    }

    const newVid = vehicles.reduce((m, v) => Math.max(m, v.id), 0) + 1;
    const vehicle = {
      id: newVid,
      userId: 0,
      brandId: bid,
      modelId: mid,
      plate: plateNorm,
      year: null,
      color: null,
      mileage: 0,
      insuranceId: null,
      insuranceNumber: "",
      status: "Cita programada",
      workshopId: wid,
      taller: null,
      owner: {
        name: nom,
        phone: "",
        email: "",
      },
      facturas: { totalGlobalAnyo: 0, historial: [] },
      gastoGasolina: { totalUltimoMes: 0, historial: [] },
      citaRechazoMensaje: null,
      citaFechaEntrada: entry,
    };
    vehicles.push(vehicle);

    const row = {
      id: nextAppointmentId++,
      vehicleId: vehicle.id,
      userId: 0,
      workshopId: wid,
      comment: "",
      status: "scheduled",
      assignedStaffId: sid,
      scheduledEntryDate: entry,
      scheduledExitDate: exitD,
      serviceId: svcId,
      manual: true,
      createdAt: new Date().toISOString(),
    };
    appointmentRequests.push(row);

    setTimeout(() => {
      res.status(201).json({
        appointment: enrichAppointmentRequest(row),
        vehicle: enrichVehicleListItem(vehicle),
      });
    }, 200);
  },
);

app.patch(
  "/api/taller/citas/:id/aceptar",
  authMiddleware,
  requireTallerStaff,
  requireTallerAdmin,
  (req, res) => {
  const id = Number(req.params.id);
  const row = appointmentRequests.find((r) => r.id === id);
  if (!row || row.status !== "pending") {
    return res.status(404).json({ message: "Solicitud no encontrada" });
  }
  if (Number(row.workshopId) !== Number(req.user.workshopId)) {
    return res.status(403).json({ message: "No autorizado" });
  }
  row.status = "accepted";
  const vehicle = vehicles.find((v) => v.id === row.vehicleId);
  setTimeout(() => {
    res.json({
      appointment: enrichAppointmentRequest(row),
      vehicle: vehicle ? enrichVehicleListItem(vehicle) : null,
    });
  }, 200);
  },
);

app.patch(
  "/api/taller/citas/:id/rechazar",
  authMiddleware,
  requireTallerStaff,
  requireTallerAdmin,
  (req, res) => {
  const id = Number(req.params.id);
  const row = appointmentRequests.find((r) => r.id === id);
  if (!row || row.status !== "pending") {
    return res.status(404).json({ message: "Solicitud no encontrada" });
  }
  if (Number(row.workshopId) !== Number(req.user.workshopId)) {
    return res.status(403).json({ message: "No autorizado" });
  }
  row.status = "rejected";
  const vehicle = vehicles.find((v) => v.id === row.vehicleId);
  if (vehicle) {
    vehicle.citaRechazoMensaje = CITA_RECHAZO_MENSAJE;
  }
  setTimeout(() => {
    res.json({
      appointment: enrichAppointmentRequest(row),
      vehicle: vehicle ? enrichVehicleListItem(vehicle) : null,
    });
  }, 200);
  },
);

app.patch(
  "/api/taller/citas/:id/asignar",
  authMiddleware,
  requireTallerStaff,
  requireTallerAdmin,
  (req, res) => {
  const id = Number(req.params.id);
  const row = appointmentRequests.find((r) => r.id === id);
  if (!row || row.status !== "accepted") {
    return res.status(404).json({ message: "Solicitud no asignable" });
  }
  if (Number(row.workshopId) !== Number(req.user.workshopId)) {
    return res.status(403).json({ message: "No autorizado" });
  }

  const { assignedStaffId, scheduledEntryDate } = req.body ?? {};
  const sid = Number(assignedStaffId);
  const fecha = String(scheduledEntryDate ?? "").trim();

  if (!sid || !fecha) {
    return res.status(400).json({ message: "Empleado y fecha de entrada obligatorios" });
  }

  const staffOk = staffForWorkshop(req.user.workshopId).some(
    (s) => s.id === sid,
  );
  if (!staffOk) {
    return res.status(400).json({ message: "Empleado no válido en este taller" });
  }

  row.assignedStaffId = sid;
  row.scheduledEntryDate = fecha;
  row.status = "scheduled";

  const vehicle = vehicles.find((v) => v.id === row.vehicleId);
  if (!vehicle) {
    return res.status(500).json({ message: "Vehículo inconsistente" });
  }
  vehicle.status = "Cita programada";
  vehicle.citaFechaEntrada = fecha;
  vehicle.workshopId = row.workshopId;

  setTimeout(() => {
    res.json({
      appointment: enrichAppointmentRequest(row),
      vehicle: enrichVehicleListItem(vehicle),
    });
  }, 200);
  },
);

app.post(
  "/api/taller/citas/:id/ingresar",
  authMiddleware,
  requireTallerStaff,
  requireTallerAdmin,
  (req, res) => {
  const id = Number(req.params.id);
  const row = appointmentRequests.find((r) => r.id === id);
  if (!row || row.status !== "scheduled") {
    return res.status(404).json({ message: "Cita no lista para ingreso" });
  }
  if (Number(row.workshopId) !== Number(req.user.workshopId)) {
    return res.status(403).json({ message: "No autorizado" });
  }

  const vehicle = vehicles.find((v) => v.id === row.vehicleId);
  if (!vehicle || vehicle.status !== "Cita programada") {
    return res.status(400).json({ message: "Estado del vehículo no válido" });
  }

  const ws = workshops.find((w) => w.id === row.workshopId);
  const entry = row.scheduledEntryDate || todayISO();
  let estimatedFinish;
  if (row.scheduledExitDate) {
    estimatedFinish = String(row.scheduledExitDate).slice(0, 10);
  } else {
    const entryD = new Date(entry);
    const estD = new Date(entryD);
    estD.setDate(estD.getDate() + 7);
    estimatedFinish = estD.toISOString().slice(0, 10);
  }

  const svcId = row.serviceId ? Number(row.serviceId) : 1;
  const svcRow = services.find((s) => s.id === svcId) || services[0];

  vehicle.status = "En Taller";
  vehicle.citaFechaEntrada = null;
  vehicle.taller = {
    name: ws?.name ?? "Taller",
    entryDate: entry,
    estimatedFinish,
    exitDate: null,
    servicio: svcRow?.name ?? "revision",
    serviceId: svcRow?.id ?? 1,
    repairStatus: "en_espera",
    performedByStaffId: row.assignedStaffId,
    additionalServices: [],
  };

  row.status = "ingresada";

  setTimeout(() => {
    res.json({
      appointment: enrichAppointmentRequest(row),
      vehicle: enrichVehicleListItem(vehicle),
      workshopVehicle: enrichWorkshopVehicle(vehicle),
    });
  }, 200);
  },
);

app.get(
  "/api/taller/panel",
  authMiddleware,
  requireTallerStaff,
  (req, res) => {
    setTimeout(() => {
      res.json(computeWorkshopPanelPayload(req.user.workshopId));
    }, 300);
  },
);

app.patch(
  "/api/taller/ordenes/:vehicleId",
  authMiddleware,
  requireTallerStaff,
  (req, res) => {
  const vehicleId = Number(req.params.vehicleId);
  const vehicle = vehicles.find((v) => v.id === vehicleId);

  if (!vehicle || !vehicle.taller || !isWorkshopPanelVehicle(vehicle)) {
    return res.status(404).json({ message: "Orden no encontrada" });
  }
  if (Number(vehicle.workshopId) !== Number(req.user.workshopId)) {
    return res.status(403).json({ message: "Vehículo de otro taller" });
  }

  const { repairStatus, performedByStaffId, serviceId } = req.body ?? {};
  const allowedRepair = ["en_espera", "en_curso", "finalizada"];

  if (repairStatus !== undefined) {
    if (!allowedRepair.includes(repairStatus)) {
      return res.status(400).json({ message: "Estado de reparación no válido" });
    }
    vehicle.taller.repairStatus = repairStatus;
    if (repairStatus === "finalizada") {
      vehicle.status = "Pendiente Recogida";
      if (!vehicle.taller.exitDate) {
        vehicle.taller.exitDate = todayISO();
      }
    } else if (repairStatus === "en_curso" || repairStatus === "en_espera") {
      vehicle.status = "En Taller";
    }
  }

  if (performedByStaffId !== undefined) {
    const pid =
      performedByStaffId === null ? null : Number(performedByStaffId);
    if (
      pid !== null &&
      !staffForWorkshop(req.user.workshopId).some((s) => s.id === pid)
    ) {
      return res
        .status(400)
        .json({ message: "Mecánico no válido en este taller" });
    }
    vehicle.taller.performedByStaffId = pid;
  }

  if (serviceId !== undefined) {
    const sid = Number(serviceId);
    const svc = services.find((s) => s.id === sid);
    if (!svc) {
      return res.status(400).json({ message: "Servicio no válido" });
    }
    vehicle.taller.serviceId = sid;
    vehicle.taller.servicio = svc.name;
  }

  setTimeout(() => {
    res.json(enrichWorkshopVehicle(vehicle));
  }, 200);
  },
);

app.post(
  "/api/taller/ordenes/:vehicleId/servicios",
  authMiddleware,
  requireTallerStaff,
  (req, res) => {
  const vehicleId = Number(req.params.vehicleId);
  const vehicle = vehicles.find((v) => v.id === vehicleId);

  if (!vehicle || !vehicle.taller || !isWorkshopPanelVehicle(vehicle)) {
    return res.status(404).json({ message: "Orden no encontrada" });
  }
  if (Number(vehicle.workshopId) !== Number(req.user.workshopId)) {
    return res.status(403).json({ message: "Vehículo de otro taller" });
  }

  const { serviceId } = req.body ?? {};
  if (serviceId === undefined || serviceId === null) {
    return res.status(400).json({ message: "Falta serviceId" });
  }

  const sid = Number(serviceId);
  const svc = services.find((s) => s.id === sid);
  if (!svc) {
    return res.status(400).json({ message: "Servicio no válido" });
  }

  if (!Array.isArray(vehicle.taller.additionalServices)) {
    vehicle.taller.additionalServices = [];
  }

  const exists = vehicle.taller.additionalServices.some(
    (x) => x.serviceId === sid,
  );
  if (exists) {
    return res.status(409).json({ message: "El servicio ya está añadido" });
  }

  vehicle.taller.additionalServices.push({
    serviceId: sid,
    name: svc.name,
  });

  setTimeout(() => {
    res.status(201).json(enrichWorkshopVehicle(vehicle));
  }, 200);
  },
);

app.get("/api/taller/chat", authMiddleware, requireTallerStaff, (req, res) => {
  setTimeout(() => {
    res.json(workshopChatMessages);
  }, 300);
});

app.get(
  "/api/taller/facturacion/vehicles",
  authMiddleware,
  requireTallerStaff,
  requireTallerAdmin,
  (req, res) => {
    setTimeout(() => {
      res.json(listVehiclesInTallerForWorkshop(req.user.workshopId));
    }, 200);
  },
);

app.get(
  "/api/taller/facturacion",
  authMiddleware,
  requireTallerStaff,
  requireTallerAdmin,
  (req, res) => {
    const now = new Date();
    const maxYear = now.getFullYear();
    const y = Number(req.query.year) || maxYear;
    const m = Number(req.query.month) || now.getMonth() + 1;
    if (y !== maxYear || m < 1 || m > 12) {
      return res
        .status(400)
        .json({ message: "Solo se puede consultar el año en curso (1–12 mes)" });
    }
    const wid = Number(req.user.workshopId);
    const list = invoicesForWorkshopMonth(wid, m, y);
    const summary = summarizeWorkshopInvoices(list);
    const catalog = services.map((s) => ({
      id: s.id,
      name: s.name,
      priceExVat: s.priceExVat,
    }));
    setTimeout(() => {
      res.json({
        year: y,
        month: m,
        ivaRate: TALLER_VAT_RATE,
        issuer: tallerIssuer(req),
        summary,
        invoices: [...list].sort((a, b) => b.id - a.id),
        services: catalog,
        yearOptions: [maxYear],
      });
    }, 200);
  },
);

app.post(
  "/api/taller/facturacion",
  authMiddleware,
  requireTallerStaff,
  requireTallerAdmin,
  (req, res) => {
    const { vehicleId, lines: rawLines } = req.body ?? {};
    const vid = Number(vehicleId);
    const vehicle = vehicles.find((v) => v.id === vid);
    if (!vehicle || !isWorkshopPanelVehicle(vehicle)) {
      return res.status(404).json({
        message: "Vehículo no encontrado o no está en el taller",
      });
    }
    if (Number(vehicle.workshopId) !== Number(req.user.workshopId)) {
      return res.status(403).json({ message: "No autorizado" });
    }
    const lines = normalizeInvoiceLines(rawLines);
    if (!lines) {
      return res.status(400).json({ message: "Líneas de factura no válidas" });
    }
    const { baseTotal, ivaAmount, totalWithVat } = computeTotalsFromLines(
      lines,
      TALLER_VAT_RATE,
    );
    const brand = brands.find((b) => b.id == vehicle.brandId);
    const model = models.find((m) => m.id == vehicle.modelId);
    const issueDate = todayISO();
    const d = new Date(issueDate);
    const newId =
      workshopInvoices.reduce((max, i) => Math.max(max, i.id), 0) + 1;
    const inv = {
      id: newId,
      workshopId: Number(req.user.workshopId),
      invoiceNumber: `FAC-${d.getFullYear()}-${String(newId).padStart(4, "0")}`,
      vehicleId: vehicle.id,
      vehiclePlate: vehicle.plate,
      brandName: brand?.name ?? "",
      modelName: model?.name ?? "",
      ownerName: vehicle.owner?.name ?? "",
      issueDate,
      year: d.getFullYear(),
      month: d.getMonth() + 1,
      status: "pending",
      paidAt: null,
      lines,
      baseTotal,
      ivaRate: TALLER_VAT_RATE,
      ivaAmount,
      totalWithVat,
      createdByRole: req.user.role,
    };
    workshopInvoices.push(inv);
    setTimeout(() => {
      res.status(201).json(inv);
    }, 200);
  },
);

app.patch(
  "/api/taller/facturacion/:id/pagar",
  authMiddleware,
  requireTallerStaff,
  requireTallerAdmin,
  (req, res) => {
    const id = Number(req.params.id);
    const inv = workshopInvoices.find((i) => i.id === id);
    if (!inv || Number(inv.workshopId) !== Number(req.user.workshopId)) {
      return res.status(404).json({ message: "Factura no encontrada" });
    }
    if (inv.status === "paid") {
      return res.status(400).json({ message: "La factura ya está pagada" });
    }
    inv.status = "paid";
    inv.paidAt = new Date().toISOString();
    setTimeout(() => {
      res.json(inv);
    }, 200);
  },
);

app.get(
  "/api/taller/ver-facturas",
  authMiddleware,
  requireTallerStaff,
  (req, res) => {
    if (req.user.role !== "empleado") {
      return res
        .status(403)
        .json({ message: "Solo empleado puede acceder a ver facturas" });
    }
    const wid = Number(req.user.workshopId);
    const list = workshopInvoices.filter(
      (inv) => Number(inv.workshopId) === wid,
    );
    setTimeout(() => {
      res.json([...list].sort((a, b) => b.id - a.id));
    }, 300);
  },
);

app.get("/api/vehicles", authMiddleware, requireCliente, (req, res) => {
  const list = vehicles.filter((v) => v.userId === Number(req.user.sub));
  res.json(list.map((vehicle) => enrichVehicleListItem(vehicle)));
});

app.get(
  "/api/vehicle/:userId/:id",
  authMiddleware,
  requireCliente,
  (req, res) => {
  const { userId, id } = req.params;
  if (Number(userId) !== Number(req.user.sub)) {
    return res.status(403).json({ message: "No autorizado" });
  }

  const vehicle = vehicles.find((v) => v.id == id && v.userId == userId);

  if (!vehicle) {
    return res.status(404).json({ message: "Vehículo no encontrado" });
  }

  res.json(enrichVehicleListItem(vehicle));
});

/* =========================
   POST VEHICLE
========================= */

app.post("/api/vehicles", authMiddleware, requireCliente, (req, res) => {
  const {
    brandId,
    modelId,
    plate,
    year,
    color,
    mileage,
    insuranceId,
    insuranceNumber,
  } = req.body ?? {};
  const uid = Number(req.user.sub);

  if (!brandId || !modelId || !plate) {
    return res.status(400).json({ message: "Faltan campos" });
  }

  const acc = accountById(uid);
  const newVehicle = {
    id: vehicles.reduce((m, v) => Math.max(m, v.id), 0) + 1,
    userId: uid,
    brandId: Number(brandId),
    modelId: Number(modelId),
    plate: String(plate).toUpperCase(),
    year: year ? Number(year) : null,
    color: color ? String(color) : null,
    mileage:
      mileage !== undefined && mileage !== null && mileage !== ""
        ? Number(mileage)
        : 0,
    insuranceId: insuranceId ? Number(insuranceId) : null,
    insuranceNumber: insuranceNumber ? String(insuranceNumber) : "",
    status: "Disponible",
    workshopId: null,
    taller: null,
    owner: acc
      ? {
          name: acc.name,
          phone: acc.phone,
          email: acc.email,
        }
      : null,
    facturas: { totalGlobalAnyo: 0, historial: [] },
    gastoGasolina: { totalUltimoMes: 0, historial: [] },
  };

  vehicles.push(newVehicle);
  res.status(201).json(enrichVehicleListItem(newVehicle));
});

app.put("/api/vehicle/:userId/:id", authMiddleware, requireCliente, (req, res) => {
  const { userId, id } = req.params;
  if (Number(userId) !== Number(req.user.sub)) {
    return res.status(403).json({ message: "No autorizado" });
  }
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

  res.json(enrichVehicleListItem(updatedVehicle));
});

app.delete(
  "/api/vehicle/:userId/:id",
  authMiddleware,
  requireCliente,
  (req, res) => {
    const { userId, id } = req.params;
    if (Number(userId) !== Number(req.user.sub)) {
      return res.status(403).json({ message: "No autorizado" });
    }
    const idx = vehicles.findIndex(
      (v) => v.id == id && v.userId == userId,
    );
    if (idx === -1) {
      return res.status(404).json({ message: "Vehículo no encontrado" });
    }
    const v = vehicles[idx];
    const vid = v.id;
    if (v.status === "En Taller" || v.status === "Pendiente Recogida") {
      return res.status(400).json({
        message:
          "No se puede eliminar un vehículo con reparación activa en el taller",
      });
    }
    if (findActiveAppointmentForVehicle(v.id)) {
      return res.status(400).json({
        message:
          "No se puede eliminar: hay una cita o solicitud activa. Resuélvela antes.",
      });
    }
    vehicles.splice(idx, 1);
    for (let i = appointmentRequests.length - 1; i >= 0; i--) {
      if (appointmentRequests[i].vehicleId === vid) {
        appointmentRequests.splice(i, 1);
      }
    }
    res.status(204).send();
  },
);

/* =========================
   POST FACTURAS
========================= */

app.post(
  "/api/vehicle/:userId/:vehicleId/facturas",
  authMiddleware,
  requireCliente,
  (req, res) => {
  const { userId, vehicleId } = req.params;
  if (Number(userId) !== Number(req.user.sub)) {
    return res.status(403).json({ message: "No autorizado" });
  }
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
  },
);

/* =========================
   POST GASOIL
========================= */

app.post(
  "/api/vehicle/:userId/:vehicleId/gasoil",
  authMiddleware,
  requireCliente,
  (req, res) => {
  const { userId, vehicleId } = req.params;
  if (Number(userId) !== Number(req.user.sub)) {
    return res.status(403).json({ message: "No autorizado" });
  }
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
  },
);

/* ========================= */

app.listen(PORT, () => {
  console.log(`Mock API running on http://localhost:${PORT}`);
});
