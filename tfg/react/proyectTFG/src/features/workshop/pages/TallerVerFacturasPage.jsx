import { useQuery } from "@tanstack/react-query";
import { API_TALLER_VER_FACTURAS_URL } from "../../../constantes/constantes";
import useWorkshopAuth from "../context/useWorkshopAuth";

function money(n) {
  return `${Number(n).toFixed(2)} €`;
}

function TallerVerFacturasPage() {
  const { authFetch } = useWorkshopAuth();
  const { data = [], isPending, isError, error } = useQuery({
    queryKey: ["taller-ver-facturas"],
    queryFn: async () => {
      const response = await authFetch(API_TALLER_VER_FACTURAS_URL);
      if (!response.ok) {
        throw new Error("No se pudo cargar la vista de facturas");
      }
      return response.json();
    },
  });

  return (
    <>
      <div className="garage__header">
        <div>
          <h1>Ver facturas</h1>
          <p>Listado de facturas del taller (solo lectura)</p>
        </div>
      </div>
      {isPending && <p>Cargando facturas...</p>}
      {isError && <p>{error.message}</p>}
      {!isPending && !isError && data.length === 0 && (
        <p className="taller-facturacion__empty">No hay facturas registradas.</p>
      )}
      {!isPending && !isError && data.length > 0 && (
        <ul className="taller-facturacion__table taller-facturacion__table--readonly">
          {data.map((inv) => (
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
              </div>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

export default TallerVerFacturasPage;
