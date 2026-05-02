import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { API_TALLER_FACTURACION_URL } from "../../../constantes/constantes";
import StatsCard from "../../garage/components/StatsCard";
import GenerarFacturaModal from "../components/GenerarFacturaModal";
import useWorkshopAuth from "../context/useWorkshopAuth";

const MESES = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
];

function money(n) {
  return `${Number(n).toFixed(2)} €`;
}

function TallerFacturacionPage() {
  const { authFetch } = useWorkshopAuth();
  const queryClient = useQueryClient();
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [showModal, setShowModal] = useState(false);

  const { data, isPending, isError, error } = useQuery({
    queryKey: ["taller-facturacion", month, year],
    queryFn: async () => {
      const url = `${API_TALLER_FACTURACION_URL}?month=${month}&year=${year}`;
      const response = await authFetch(url);
      if (!response.ok) {
        const j = await response.json().catch(() => ({}));
        throw new Error(j.message || "No se pudo cargar la facturación");
      }
      return response.json();
    },
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["taller-facturacion"] });
    queryClient.invalidateQueries({ queryKey: ["taller-ver-facturas"] });
  };

  const pagarMut = useMutation({
    mutationFn: async (id) => {
      const r = await authFetch(
        `${API_TALLER_FACTURACION_URL}/${id}/pagar`,
        { method: "PATCH" },
      );
      const j = await r.json().catch(() => ({}));
      if (!r.ok) {
        throw new Error(j.message || "Error");
      }
      return j;
    },
    onSuccess: invalidate,
  });

  const summary = data?.summary;
  const yearOptions = data?.yearOptions ?? [now.getFullYear()];

  return (
    <>
      <div className="garage__header taller-facturacion__header">
        <div>
          <h1>Facturación</h1>
          <p>
            Resumen mensual del taller ·{" "}
            <strong>
              {MESES[(data?.month ?? month) - 1]} {data?.year ?? year}
            </strong>
          </p>
        </div>
        <div className="taller-facturacion__filters">
          <label>
            Mes
            <select
              value={month}
              onChange={(e) => setMonth(Number(e.target.value))}
            >
              {MESES.map((label, i) => (
                <option key={label} value={i + 1}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <label>
            Año
            <select
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
            >
              {yearOptions.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </label>
          <button
            type="button"
            className="modal-form-btn modal-form-btn--primary taller-facturacion__gen-btn"
            onClick={() => setShowModal(true)}
            disabled={!data?.services?.length}
          >
            Generar factura
          </button>
        </div>
      </div>

      {isPending && <p>Cargando facturación...</p>}
      {isError && <p className="workshop-modal-error">{error.message}</p>}

      {summary && (
        <div className="garage__stats taller-facturacion__stats">
          <StatsCard
            type="facturacionEmitidas"
            value={summary.emitidasCount}
          />
          <StatsCard
            type="facturacionImporte"
            value={money(summary.totalImporteConIva)}
          />
          <StatsCard
            type="facturacionPagadas"
            value={`${summary.pagadasCount} · ${money(summary.pagadasImporteConIva)}`}
          />
          <StatsCard
            type="facturacionPorPagar"
            value={`${summary.porPagarCount} · ${money(summary.porPagarImporteConIva)}`}
          />
        </div>
      )}

      {data?.invoices?.length > 0 && (
        <section className="taller-facturacion__list">
          <h2>Facturas del mes</h2>
          <ul className="taller-facturacion__table">
            {data.invoices.map((inv) => (
              <li key={inv.id} className="taller-facturacion__row">
                <div>
                  <strong>{inv.invoiceNumber}</strong>
                  <span className="taller-facturacion__meta">
                    {inv.issueDate} · {inv.vehiclePlate} · {inv.ownerName}
                  </span>
                </div>
                <div className="taller-facturacion__amounts">
                  <span>{money(inv.totalWithVat)}</span>
                  <span
                    className={
                      inv.status === "paid"
                        ? "taller-facturacion__badge taller-facturacion__badge--paid"
                        : "taller-facturacion__badge taller-facturacion__badge--pending"
                    }
                  >
                    {inv.status === "paid" ? "Pagada" : "Por pagar"}
                  </span>
                  {inv.status === "pending" && (
                    <button
                      type="button"
                      className="taller-cita-btn taller-cita-btn--ok"
                      disabled={pagarMut.isPending}
                      onClick={() => pagarMut.mutate(inv.id)}
                    >
                      Marcar pagada
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      {data?.invoices?.length === 0 && !isPending && data && (
        <p className="taller-facturacion__empty">
          No hay facturas registradas en este mes.
        </p>
      )}

      {showModal && data?.services && (
        <GenerarFacturaModal
          services={data.services}
          ivaRate={data.ivaRate}
          issuer={data.issuer}
          onClose={() => setShowModal(false)}
          onCreated={invalidate}
        />
      )}
    </>
  );
}

export default TallerFacturacionPage;
