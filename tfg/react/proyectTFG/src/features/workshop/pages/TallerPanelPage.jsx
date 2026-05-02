import { useQuery } from "@tanstack/react-query";
import { API_TALLER_PANEL_URL } from "../../../constantes/constantes";

async function fetchPanel() {
  const response = await fetch(API_TALLER_PANEL_URL);
  if (!response.ok) {
    throw new Error("No se pudo cargar el panel del taller");
  }
  return response.json();
}

function TallerPanelPage() {
  const { data, isPending, isError, error } = useQuery({
    queryKey: ["taller-panel"],
    queryFn: fetchPanel,
  });

  return (
    <div className="garage__header">
      <div>
        <h1>Panel taller</h1>
        {isPending && <p>Cargando datos del panel...</p>}
        {isError && <p>{error.message}</p>}
        {data && (
          <p>
            Ordenes activas: {data.activeOrders} | Vehiculos en espera:{" "}
            {data.waitingVehicles} | Entregas hoy: {data.deliveriesToday}
          </p>
        )}
      </div>
    </div>
  );
}

export default TallerPanelPage;
