import { useParams } from "react-router-dom";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { API_VEHICLE_URL } from "../../../constantes/constantes";
import Navbar from "../components/navBar";

function VehicleDetailPage() {
  const { id, userId } = useParams();
  const [pageSelected, setPageSelected] = useState("garage-detail");
  const [mostrarModal, setMostrarModal] = useState(false);

  function abrirModal() {
    console.log("Abrir modal para añadir vehículo");
    setMostrarModal(true);
  }
  function cerrarModal() {
    console.log("Cerrar modal de añadir vehículo");
    setMostrarModal(false);
  }

  const {
    data: vehicle,
    isPending,
    isError,
    error,
  } = useQuery({
    queryKey: ["vehicle", userId, id],
    queryFn: async () => {
      const res = await fetch(`${API_VEHICLE_URL}/${userId}/${id}`);
      if (!res.ok) {
        throw new Error("Error al obtener el vehículo");
      }
      return res.json();
    },
  });
  if (isPending) return <p>Cargando...</p>;
  if (isError) return <p>Error: {error?.message}</p>;

  return (
    <>
      <Navbar pageSelected={pageSelected} setPageSelected={setPageSelected} />
      <div className="vehicleDetail-page">
        <div className="detail">
          <div className="detail__header">
            <div>
              <h1>Mi Garaje Virtual - Vehiculo : {id}</h1>
              <h2>
                {vehicle.brandName} - {vehicle.modelName}
              </h2>
              <p>Gestiona tus vehículos y su estado</p>
            </div>

            <button
              onClick={() =>
                mostrarModal === false ? abrirModal() : cerrarModal()
              }
            >
              Editar Vehículo
            </button>
          </div>
          {mostrarModal && <ModalForm onClose={cerrarModal} userId={userId} />}

          {/*<div className="vehicle-info">
            <p>
              <strong>Año:</strong> {vehicle.year}
            </p>
            <p>
              <strong>Color:</strong> {vehicle.color}
            </p>
            <p>
              <strong>Kilómetros:</strong> {vehicle.mileage}
            </p>
            <p>
              <strong>Aseguradora:</strong> {vehicle.insuranceName}
            </p>
            <p>
              <strong>Nº póliza:</strong> {vehicle.insuranceNumber}
            </p>
            <p>
              <strong>Estado:</strong> {vehicle.status}
            </p>
          </div>*/}
        </div>
      </div>
    </>
  );
}

export default VehicleDetailPage;
