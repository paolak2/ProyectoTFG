import { useQuery } from "@tanstack/react-query";
import { API_TALLER_FACTURACION_URL } from "../../../constantes/constantes";

async function fetchFacturacion() {
  const response = await fetch(API_TALLER_FACTURACION_URL);
  if (!response.ok) {
    throw new Error("No se pudo cargar la facturacion");
  }
  return response.json();
}

function TallerFacturacionPage() {
  const { data, isPending, isError, error } = useQuery({
    queryKey: ["taller-facturacion"],
    queryFn: fetchFacturacion,
  });

  return (
    <div className="garage__header">
      <div>
        <h1>Facturación</h1>
        {isPending && <p>Cargando facturacion...</p>}
        {isError && <p>{error.message}</p>}
        {data && (
          <p>
            Facturas emitidas: {data.totalInvoices} | Importe total:{" "}
            {data.totalAmount} EUR
          </p>
        )}
      </div>
    </div>
  );
}

export default TallerFacturacionPage;
