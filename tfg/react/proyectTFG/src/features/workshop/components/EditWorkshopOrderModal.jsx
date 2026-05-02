import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { API_TALLER_ORDENES_URL } from "../../../constantes/constantes";
import useWorkshopAuth from "../context/useWorkshopAuth";

const REPAIR_OPTIONS = [
  { value: "en_espera", label: "En espera" },
  { value: "en_curso", label: "En curso" },
  { value: "finalizada", label: "Finalizada" },
];

function EditWorkshopOrderModal({
  vehicle,
  staff,
  services,
  sessionStaffId,
  onClose,
}) {
  const { authFetch } = useWorkshopAuth();
  const queryClient = useQueryClient();
  const [repairStatus, setRepairStatus] = useState(
    vehicle.taller.repairStatus,
  );
  const resolvedStaffDefault =
    vehicle.taller.performedByStaffId ??
    sessionStaffId ??
    staff[0]?.id ??
    "";

  const [performedByStaffId, setPerformedByStaffId] = useState(
    String(resolvedStaffDefault),
  );
  const [serviceId, setServiceId] = useState(String(vehicle.taller.serviceId));

  useEffect(() => {
    const def =
      vehicle.taller.performedByStaffId ??
      sessionStaffId ??
      staff[0]?.id ??
      "";
    setRepairStatus(vehicle.taller.repairStatus);
    setPerformedByStaffId(String(def));
    setServiceId(String(vehicle.taller.serviceId));
  }, [vehicle, sessionStaffId, staff]);

  const mutation = useMutation({
    mutationFn: async (body) => {
      const res = await authFetch(`${API_TALLER_ORDENES_URL}${vehicle.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || "No se pudo actualizar la orden");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["taller-panel"] });
      onClose();
    },
  });

  function handleSubmit(e) {
    e.preventDefault();
    mutation.mutate({
      repairStatus,
      performedByStaffId: performedByStaffId
        ? Number(performedByStaffId)
        : null,
      serviceId: Number(serviceId),
    });
  }

  return (
    <div className="modal-overlay" role="presentation" onClick={onClose}>
      <div
        className="modal-new-vehicle"
        role="dialog"
        aria-labelledby="edit-order-title"
        onClick={(e) => e.stopPropagation()}
      >
        <button type="button" className="close-btn" onClick={onClose}>
          ×
        </button>
        <h2 id="edit-order-title">Editar orden de taller</h2>
        <p className="workshop-modal-hint">
          {vehicle.brandName} {vehicle.modelName} · {vehicle.plate}
        </p>
        <form className="form workshop-modal-form" onSubmit={handleSubmit}>
          <label>
            Estado de la reparación
            <select
              value={repairStatus}
              onChange={(e) => setRepairStatus(e.target.value)}
              required
            >
              {REPAIR_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>
          <label>
            Realizado por
            <select
              value={performedByStaffId}
              onChange={(e) => setPerformedByStaffId(e.target.value)}
              required
            >
              {staff.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
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
          {mutation.isError && (
            <p className="workshop-modal-error">{mutation.error.message}</p>
          )}
          <div className="workshop-modal-actions">
            <button type="button" className="workshop-btn-secondary" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? "Guardando…" : "Guardar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default EditWorkshopOrderModal;
