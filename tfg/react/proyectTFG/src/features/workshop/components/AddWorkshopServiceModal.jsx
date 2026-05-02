import { useEffect, useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { API_TALLER_ORDENES_URL } from "../../../constantes/constantes";

async function postServicio(vehicleId, serviceId) {
  const res = await fetch(
    `${API_TALLER_ORDENES_URL}${vehicleId}/servicios`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ serviceId }),
    },
  );
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || "No se pudo añadir el servicio");
  }
  return res.json();
}

function AddWorkshopServiceModal({ vehicle, services, onClose }) {
  const queryClient = useQueryClient();
  const usedIds = useMemo(() => {
    const ids = new Set();
    if (vehicle.taller?.serviceId) {
      ids.add(vehicle.taller.serviceId);
    }
    (vehicle.taller?.additionalServices ?? []).forEach((x) =>
      ids.add(x.serviceId),
    );
    return ids;
  }, [vehicle.taller]);

  const available = useMemo(
    () => services.filter((s) => !usedIds.has(s.id)),
    [services, usedIds],
  );

  const [serviceId, setServiceId] = useState(
    available[0] ? String(available[0].id) : "",
  );

  useEffect(() => {
    if (available[0]) {
      setServiceId(String(available[0].id));
    } else {
      setServiceId("");
    }
  }, [available]);

  const mutation = useMutation({
    mutationFn: () => postServicio(vehicle.id, Number(serviceId)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["taller-panel"] });
      onClose();
    },
  });

  function handleSubmit(e) {
    e.preventDefault();
    if (!serviceId) {
      return;
    }
    mutation.mutate();
  }

  return (
    <div className="modal-overlay" role="presentation" onClick={onClose}>
      <div
        className="modal-new-vehicle modal-new-vehicle--compact"
        role="dialog"
        aria-labelledby="add-svc-title"
        onClick={(e) => e.stopPropagation()}
      >
        <button type="button" className="close-btn" onClick={onClose}>
          ×
        </button>
        <h2 id="add-svc-title">Añadir servicio</h2>
        <p className="workshop-modal-hint">
          Se añadirá como servicio adicional para {vehicle.plate}.
        </p>
        {available.length === 0 ? (
          <p className="workshop-modal-hint">No hay más servicios disponibles.</p>
        ) : (
          <form className="form workshop-modal-form" onSubmit={handleSubmit}>
            <label>
              Servicio
              <select
                value={serviceId}
                onChange={(e) => setServiceId(e.target.value)}
                required
              >
                {available.map((s) => (
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
              <button
                type="button"
                className="workshop-btn-secondary"
                onClick={onClose}
              >
                Cancelar
              </button>
              <button type="submit" disabled={mutation.isPending}>
                {mutation.isPending ? "Añadiendo…" : "Añadir"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

export default AddWorkshopServiceModal;
