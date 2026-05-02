import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { API_TALLER_CITAS_URL } from "../../../constantes/constantes";
import AsignarCitaModal from "../components/AsignarCitaModal";
import ManualCitaModal from "../components/ManualCitaModal";
import useWorkshopAuth from "../context/useWorkshopAuth";

function TallerCitasPage() {
  const { role, authFetch } = useWorkshopAuth();
  const queryClient = useQueryClient();
  const { data, isPending, isError, error } = useQuery({
    queryKey: ["taller-citas", role],
    queryFn: async () => {
      const res = await authFetch(API_TALLER_CITAS_URL);
      if (!res.ok) {
        throw new Error("No se pudieron cargar las citas");
      }
      return res.json();
    },
    enabled: role === "admin",
  });
  /* Ruta protegida con RequireWorkshopRole (solo admin) */

  const [assignFor, setAssignFor] = useState(null);
  const [showManualCita, setShowManualCita] = useState(false);

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["taller-citas"] });
    queryClient.invalidateQueries({ queryKey: ["taller-panel"] });
    queryClient.invalidateQueries({ queryKey: ["vehicles"] });
  };

  const aceptarMut = useMutation({
    mutationFn: async (id) => {
      const r = await authFetch(`${API_TALLER_CITAS_URL}/${id}/aceptar`, {
        method: "PATCH",
      });
      if (!r.ok) {
        const j = await r.json().catch(() => ({}));
        throw new Error(j.message || "Error");
      }
      return r.json();
    },
    onSuccess: invalidate,
  });

  const rechazarMut = useMutation({
    mutationFn: async (id) => {
      const r = await authFetch(`${API_TALLER_CITAS_URL}/${id}/rechazar`, {
        method: "PATCH",
      });
      if (!r.ok) {
        const j = await r.json().catch(() => ({}));
        throw new Error(j.message || "Error");
      }
      return r.json();
    },
    onSuccess: invalidate,
  });

  const ingresarMut = useMutation({
    mutationFn: async (id) => {
      const r = await authFetch(`${API_TALLER_CITAS_URL}/${id}/ingresar`, {
        method: "POST",
      });
      if (!r.ok) {
        const j = await r.json().catch(() => ({}));
        throw new Error(j.message || "Error");
      }
      return r.json();
    },
    onSuccess: invalidate,
  });

  return (
    <>
      <div className="garage__header taller-citas__header">
        <div>
          <h1>Próximas citas</h1>
          <p>Gestiona solicitudes y el ingreso de vehículos al taller</p>
        </div>
        {data?.staff?.length > 0 && data?.services?.length > 0 && (
          <button
            type="button"
            className="taller-cita-btn taller-cita-btn--ok taller-citas__manual-btn"
            onClick={() => setShowManualCita(true)}
          >
            Nueva cita manual
          </button>
        )}
      </div>

      {isPending && <p>Cargando...</p>}
      {isError && <p>{error.message}</p>}

      {data && (
        <div className="taller-citas">
          <section className="taller-citas__section">
            <h2>Nuevas solicitudes</h2>
            {data.nuevas.length === 0 && (
              <p className="taller-citas__empty">No hay solicitudes pendientes.</p>
            )}
            <div className="taller-citas__grid">
              {data.nuevas.map((c) => (
                <article key={c.id} className="taller-cita-card taller-cita-card--nueva">
                  <header>
                    <strong>
                      {c.brandName} {c.modelName}
                    </strong>
                    <span>{c.vehiclePlate}</span>
                  </header>
                  <p className="taller-cita-card__meta">
                    Cliente: {c.ownerName}
                    <br />
                    Taller: {c.workshopName}
                  </p>
                  {c.comment && (
                    <p className="taller-cita-card__comment">{c.comment}</p>
                  )}
                  <div className="taller-cita-card__actions">
                    <button
                      type="button"
                      className="taller-cita-btn taller-cita-btn--ok"
                      disabled={aceptarMut.isPending}
                      onClick={() => aceptarMut.mutate(c.id)}
                    >
                      Aceptar
                    </button>
                    <button
                      type="button"
                      className="taller-cita-btn taller-cita-btn--no"
                      disabled={rechazarMut.isPending}
                      onClick={() => rechazarMut.mutate(c.id)}
                    >
                      Rechazar
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section className="taller-citas__section">
            <h2>Aceptadas y próximas al ingreso</h2>
            {data.proximas.length === 0 && (
              <p className="taller-citas__empty">No hay citas en esta fase.</p>
            )}
            <div className="taller-citas__grid">
              {data.proximas.map((c) => (
                <article
                  key={c.id}
                  className="taller-cita-card taller-cita-card--proxima"
                >
                  <header>
                    <strong>
                      {c.brandName} {c.modelName}
                    </strong>
                    <span>{c.vehiclePlate}</span>
                  </header>
                  <p className="taller-cita-card__meta">
                    Cliente: {c.ownerName} · {c.workshopName}
                  </p>
                  {c.comment && (
                    <p className="taller-cita-card__comment">{c.comment}</p>
                  )}
                  <p className="taller-cita-card__estado">
                    {c.status === "accepted" && "Aceptada — pendiente de asignar"}
                    {c.status === "scheduled" && (
                      <>
                        Programada · entrada:{" "}
                        <strong>{c.scheduledEntryDate}</strong>
                        {c.scheduledExitDate && (
                          <>
                            {" "}
                            · salida estimada:{" "}
                            <strong>{c.scheduledExitDate}</strong>
                          </>
                        )}
                      </>
                    )}
                  </p>
                  <div className="taller-cita-card__actions">
                    {c.status === "accepted" && (
                      <button
                        type="button"
                        className="taller-cita-btn taller-cita-btn--ok"
                        onClick={() => setAssignFor(c)}
                      >
                        Asignar
                      </button>
                    )}
                    {c.status === "scheduled" && (
                      <button
                        type="button"
                        className="taller-cita-btn taller-cita-btn--ok"
                        disabled={ingresarMut.isPending}
                        onClick={() => ingresarMut.mutate(c.id)}
                      >
                        Registrar ingreso en taller
                      </button>
                    )}
                  </div>
                </article>
              ))}
            </div>
          </section>
        </div>
      )}

      {assignFor && data?.staff?.length > 0 && (
        <AsignarCitaModal
          appointment={assignFor}
          staff={data.staff}
          onClose={() => setAssignFor(null)}
          onAssigned={invalidate}
        />
      )}

      {showManualCita &&
        data?.staff?.length > 0 &&
        data?.services?.length > 0 && (
          <ManualCitaModal
            staff={data.staff}
            services={data.services}
            onClose={() => setShowManualCita(false)}
            onCreated={invalidate}
          />
        )}
    </>
  );
}

export default TallerCitasPage;
