import { useEffect, useState } from "react";
import {
  API_CITAS_URL,
  API_WORKSHOPS_URL,
} from "../../../constantes/constantes";
import { useAuth } from "../../auth/AuthContext";

/**
 * @param {"garage"|"workshop"} mode
 * @param {object|null} fixedVehicle — modo garage
 * @param {object|null} fixedWorkshop — modo workshop (tarjeta taller)
 * @param {Array} vehiclesDisponibles — vehículos Disponible sin solicitud activa
 */
function CitaSolicitudModal({
  mode,
  fixedVehicle,
  fixedWorkshop,
  vehiclesDisponibles,
  onClose,
  onSuccess,
}) {
  const { authFetch } = useAuth();
  const [workshops, setWorkshops] = useState([]);
  const [loadingWs, setLoadingWs] = useState(true);
  const [workshopId, setWorkshopId] = useState("");
  const [vehicleId, setVehicleId] = useState("");
  const [comment, setComment] = useState("");
  const [error, setError] = useState(null);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        setLoadingWs(true);
        const res = await authFetch(API_WORKSHOPS_URL);
        if (!res.ok) {
          throw new Error("No se pudieron cargar los talleres");
        }
        const list = await res.json();
        if (!cancelled) {
          setWorkshops(list);
          if (mode === "garage" && list[0]) {
            setWorkshopId(String(list[0].id));
          }
          if (mode === "workshop" && fixedWorkshop) {
            setWorkshopId(String(fixedWorkshop.id));
          }
        }
      } catch (e) {
        if (!cancelled) {
          setError(e.message);
        }
      } finally {
        if (!cancelled) {
          setLoadingWs(false);
        }
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [mode, fixedWorkshop, authFetch]);

  useEffect(() => {
    if (mode === "garage" && fixedVehicle) {
      setVehicleId(String(fixedVehicle.id));
    }
    if (mode === "workshop" && vehiclesDisponibles?.[0]) {
      setVehicleId(String(vehiclesDisponibles[0].id));
    }
  }, [mode, fixedVehicle, vehiclesDisponibles]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    const wid = Number(workshopId);
    const vid = Number(vehicleId);
    if (!wid || !vid) {
      setError("Selecciona taller y vehículo.");
      return;
    }
    setSending(true);
    try {
      const res = await authFetch(API_CITAS_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vehicleId: vid,
          workshopId: wid,
          comment,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.message || "No se pudo enviar la solicitud");
      }
      onSuccess?.(data);
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
        aria-labelledby="cita-sol-title"
        onClick={(ev) => ev.stopPropagation()}
      >
        <button type="button" className="close-btn" onClick={onClose}>
          ×
        </button>
        <h2 id="cita-sol-title">Solicitar cita en taller</h2>
        <p className="workshop-modal-hint">
          Añade un comentario opcional para el taller.
        </p>
        {loadingWs ? (
          <p>Cargando talleres...</p>
        ) : (
          <form className="form workshop-modal-form" onSubmit={handleSubmit}>
            {mode === "workshop" && !vehiclesDisponibles?.length && (
              <p className="workshop-modal-error">
                No tienes vehículos disponibles sin una solicitud activa. Solo
                pueden pedirse citas para coches en estado Disponible.
              </p>
            )}
            {mode === "garage" && (
              <label>
                Taller
                <select
                  value={workshopId}
                  onChange={(e) => setWorkshopId(e.target.value)}
                  required
                >
                  {workshops.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.name}
                    </option>
                  ))}
                </select>
              </label>
            )}
            {mode === "workshop" && (
              <label>
                Vehículo
                <select
                  value={vehicleId}
                  onChange={(e) => setVehicleId(e.target.value)}
                  required
                  disabled={!vehiclesDisponibles?.length}
                >
                  {(vehiclesDisponibles ?? []).map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.brandName} {v.modelName} · {v.plate}
                    </option>
                  ))}
                </select>
              </label>
            )}
            {mode === "garage" && fixedVehicle && (
              <p className="workshop-modal-hint">
                Vehículo:{" "}
                <strong>
                  {fixedVehicle.brandName} {fixedVehicle.modelName} ·{" "}
                  {fixedVehicle.plate}
                </strong>
              </p>
            )}
            {mode === "workshop" && fixedWorkshop && (
              <p className="workshop-modal-hint">
                Taller: <strong>{fixedWorkshop.name}</strong>
              </p>
            )}
            <label>
              Comentario (opcional)
              <textarea
                rows={3}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Describe el motivo de la visita..."
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
              <button
                type="submit"
                disabled={
                  sending ||
                  (mode === "workshop" && !vehiclesDisponibles?.length)
                }
              >
                {sending ? "Enviando…" : "Enviar solicitud"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

export default CitaSolicitudModal;
