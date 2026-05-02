import { useQuery } from "@tanstack/react-query";
import { API_TALLER_VER_FACTURAS_URL } from "../../../constantes/constantes";

async function fetchVerFacturas() {
  const response = await fetch(API_TALLER_VER_FACTURAS_URL);
  if (!response.ok) {
    throw new Error("No se pudo cargar la vista de facturas");
  }
  return response.json();
}

function TallerVerFacturasPage() {
  const { data = [], isPending, isError, error } = useQuery({
    queryKey: ["taller-ver-facturas"],
    queryFn: fetchVerFacturas,
  });

  return (
    <div className="garage__header">
      <div>
        <h1>Ver facturas</h1>
        {isPending && <p>Cargando facturas...</p>}
        {isError && <p>{error.message}</p>}
        {!isPending &&
          !isError &&
          data.map((invoice) => (
            <p key={invoice.id}>
              #{invoice.id} - {invoice.vehiclePlate} - {invoice.total} EUR
            </p>
          ))}
      </div>
    </div>
  );
}

export default TallerVerFacturasPage;
