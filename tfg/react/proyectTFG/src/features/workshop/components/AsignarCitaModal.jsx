import { useEffect, useState } from "react";
import { API_TALLER_CITAS_URL } from "../../../constantes/constantes";
import useWorkshopAuth from "../context/useWorkshopAuth";

function AsignarCitaModal({ appointment, staff, onClose, onAssigned }) {
  const { authFetch } = useWorkshopAuth();
  const [assignedStaffId, setAssignedStaffId] = useState(
    String(staff[0]?.id ?? ""),
  );
  const [scheduledEntryDate, setScheduledEntryDate] = useState("");
  const [error, setError] = useState(null);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (staff[0]) {
      setAssignedStaffId(String(staff[0].id));
    }
    const t = new Date();
    setScheduledEntryDate(t.toISOString().slice(0, 10));
  }, [appointment, staff]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setSending(true);
    try {
      const res = await authFetch(
        `${API_TALLER_CITAS_URL}/${appointment.id}/asignar`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            assignedStaffId: Number(assignedStaffId),
            scheduledEntryDate,
          }),
        },
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.message || "No se pudo asignar");
      }
      onAssigned?.(data);
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
        className="modal-new-vehicle modal-new-vehicle--compact"
        role="dialog"
        aria-labelledby="asignar-cita-title"
        onClick={(ev) => ev.stopPropagation()}
      >
        <button type="button" className="close-btn" onClick={onClose}>
          ×
        </button>
        <h2 id="asignar-cita-title">Asignar cita</h2>
        <p className="workshop-modal-hint">
          {appointment.brandName} {appointment.modelName} ·{" "}
          {appointment.vehiclePlate}
        </p>
        <form className="form workshop-modal-form" onSubmit={handleSubmit}>
          <label>
            Responsable (admin o empleado)
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
          <label>
            Fecha de entrada al taller
            <input
              type="date"
              value={scheduledEntryDate}
              onChange={(e) => setScheduledEntryDate(e.target.value)}
              required
            />
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
              {sending ? "Guardando…" : "Confirmar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AsignarCitaModal;
