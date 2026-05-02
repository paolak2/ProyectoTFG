import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { API_TALLER_PANEL_URL } from "../../../constantes/constantes";
import StatsCard from "../../garage/components/StatsCard";
import WorkshopVehicleCard from "../components/WorkshopVehicleCard";
import ContactOwnerModal from "../components/ContactOwnerModal";
import EditWorkshopOrderModal from "../components/EditWorkshopOrderModal";
import AddWorkshopServiceModal from "../components/AddWorkshopServiceModal";
import useWorkshopAuth from "../context/useWorkshopAuth";

async function fetchPanel() {
  const response = await fetch(API_TALLER_PANEL_URL);
  if (!response.ok) {
    throw new Error("No se pudo cargar el panel del taller");
  }
  return response.json();
}

function TallerPanelPage() {
  const { user, role } = useWorkshopAuth();
  const { data, isPending, isError, error } = useQuery({
    queryKey: ["taller-panel"],
    queryFn: fetchPanel,
  });

  const [modal, setModal] = useState(null);

  return (
    <>
      <div className="garage__header">
        <div>
          <h1>Panel taller</h1>
          <p>
            Órdenes en curso y entregas · sesión:{" "}
            <strong>{user?.name}</strong> ({role})
          </p>
        </div>
      </div>

      {isPending && <p>Cargando datos del panel...</p>}
      {isError && <p>{error.message}</p>}

      {data && (
        <>
          <div className="garage__stats">
            <StatsCard type="ordenesActivas" value={data.activeOrders} />
            <StatsCard type="vehiculosEspera" value={data.waitingVehicles} />
            <StatsCard type="entregasHoy" value={data.deliveriesToday} />
          </div>

          <div className="garage__vehicles">
            {data.vehicles.map((vehicle) => (
              <WorkshopVehicleCard
                key={vehicle.id}
                vehicle={vehicle}
                role={role}
                onContactOwner={() =>
                  setModal({ type: "contact", vehicle })
                }
                onEditOrder={() => setModal({ type: "edit", vehicle })}
                onAddService={() => setModal({ type: "addSvc", vehicle })}
              />
            ))}
          </div>
        </>
      )}

      {modal?.type === "contact" && (
        <ContactOwnerModal
          owner={modal.vehicle.owner}
          onClose={() => setModal(null)}
        />
      )}
      {modal?.type === "edit" && data?.staff && data?.services && (
        <EditWorkshopOrderModal
          vehicle={modal.vehicle}
          staff={data.staff}
          services={data.services}
          sessionStaffId={user?.id}
          onClose={() => setModal(null)}
        />
      )}
      {modal?.type === "addSvc" && data?.services && (
        <AddWorkshopServiceModal
          vehicle={modal.vehicle}
          services={data.services}
          onClose={() => setModal(null)}
        />
      )}
    </>
  );
}

export default TallerPanelPage;
