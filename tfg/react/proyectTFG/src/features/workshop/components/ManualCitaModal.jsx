import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  API_BRANDS_URL,
  API_MODELS_URL,
  API_TALLER_CITAS_MANUAL_URL,
} from "../../../constantes/constantes";
import useWorkshopAuth from "../context/useWorkshopAuth";

async function fetchMarcas() {
  const res = await fetch(API_BRANDS_URL);
  if (!res.ok) {
    throw new Error("Error al cargar marcas");
  }
  return res.json();
}

function ManualCitaModal({ services, staff, onClose, onCreated }) {
  const { authFetch } = useWorkshopAuth();
  const [ownerName, setOwnerName] = useState("");
  const [plate, setPlate] = useState("");
  const [brandId, setBrandId] = useState("");
  const [modelId, setModelId] = useState("");
  const [serviceId, setServiceId] = useState("");
  const [scheduledEntryDate, setScheduledEntryDate] = useState("");
  const [scheduledExitDate, setScheduledExitDate] = useState("");
  const [assignedStaffId, setAssignedStaffId] = useState("");
  const [error, setError] = useState(null);
  const [sending, setSending] = useState(false);

  const { data: marcas = [] } = useQuery({
    queryKey: ["manual-cita-marcas"],
    queryFn: fetchMarcas,
  });

  const { data: modelos = [] } = useQuery({
    queryKey: ["manual-cita-modelos", brandId],
    queryFn: async () => {
      const res = await fetch(`${API_MODELS_URL}?brandId=${brandId}`);
      if (!res.ok) {
        throw new Error("Error al cargar modelos");
      }
      return res.json();
    },
    enabled: Boolean(brandId),
  });

  useEffect(() => {
    if (staff?.length) {
      setAssignedStaffId(String(staff[0].id));
    }
  }, [staff]);

  useEffect(() => {
    if (services?.length && !serviceId) {
      setServiceId(String(services[0].id));
    }
  }, [services, serviceId]);

  useEffect(() => {
    setModelId("");
  }, [brandId]);

  useEffect(() => {
    const t = new Date();
    const d = t.toISOString().slice(0, 10);
    setScheduledEntryDate(d);
    const out = new Date(t);
    out.setDate(out.getDate() + 3);
    setScheduledExitDate(out.toISOString().slice(0, 10));
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setSending(true);
    try {
      const res = await authFetch(API_TALLER_CITAS_MANUAL_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ownerName: ownerName.trim(),
          plate: plate.trim().toUpperCase(),
          brandId: Number(brandId),
          modelId: Number(modelId),
          serviceId: Number(serviceId),
          scheduledEntryDate,
          scheduledExitDate,
          assignedStaffId: Number(assignedStaffId),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.message || "No se pudo crear la cita");
      }
      onCreated?.(data);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="modal-overlay" role="presentation" onClick={onClose}>
      <div
        className="modal-new-vehicle manual-cita-modal"
        role="dialog"
        aria-labelledby="manual-cita-title"
        onClick={(ev) => ev.stopPropagation()}
      >
        <button type="button" className="close-btn" onClick={onClose}>
          ×
        </button>
        <h2 id="manual-cita-title">Nueva cita manual</h2>
        <p className="workshop-modal-hint">
          Alta en recepción sin solicitud previa del cliente en la app.
        </p>
        <form className="form workshop-modal-form" onSubmit={handleSubmit}>
          <label>
            Nombre del dueño
            <input
              value={ownerName}
              onChange={(e) => setOwnerName(e.target.value)}
              required
            />
          </label>
          <label>
            Matrícula
            <input
              value={plate}
              onChange={(e) =>
                setPlate(e.target.value.replace(/[^A-Za-z0-9]/g, "").slice(0, 8))
              }
              required
              maxLength={8}
              placeholder="Ej. 1234ABC"
            />
          </label>
          <label>
            Marca
            <select
              value={brandId}
              onChange={(e) => setBrandId(e.target.value)}
              required
            >
              <option value="">Selecciona marca</option>
              {marcas.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            Modelo
            <select
              value={modelId}
              onChange={(e) => setModelId(e.target.value)}
              required
              disabled={!brandId}
            >
              <option value="">
                {brandId ? "Selecciona modelo" : "Primero elige marca"}
              </option>
              {modelos.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            Servicio principal
            <select
              value={serviceId}
              onChange={(e) => setServiceId(e.target.value)}
              required
            >
              {services.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            Fecha de ingreso al taller
            <input
              type="date"
              value={scheduledEntryDate}
              onChange={(e) => setScheduledEntryDate(e.target.value)}
              required
            />
          </label>
          <label>
            Fecha de salida estimada
            <input
              type="date"
              value={scheduledExitDate}
              onChange={(e) => setScheduledExitDate(e.target.value)}
              required
            />
          </label>
          <label>
            Responsable / mecánico asignado
            <select
              value={assignedStaffId}
              onChange={(e) => setAssignedStaffId(e.target.value)}
              required
            >
              {staff.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.role})
                </option>
              ))}
            </select>
          </label>
          {error && <p className="workshop-modal-error">{error}</p>}
          <div className="workshop-modal-actions">
            <button
              type="button"
              className="workshop-btn-secondary"
              onClick={onClose}
            >
              Cancelar
            </button>
            <button type="submit" disabled={sending}>
              {sending ? "Guardando…" : "Crear cita"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ManualCitaModal;
