import { useState } from "react";
import { useQuery } from "@tanstack/react-query";

import Navbar from "../components/navBar";
import StatsCard from "../components/StatsCard";
import VehicleCard from "../components/VehicleCard";
import ModalForm from "../components/modalForm";
import AddModal from "../components/AddModal";
import { API_VEHICLES_URL } from "../../../constantes/constantes";

async function fetchVehicles() {
  const res = await fetch(API_VEHICLES_URL);
  if (!res.ok) {
    throw new Error("Error al obtener vehículos");
  }
  return res.json();
}

function GaragePage() {
  const [pageSelected, setPageSelected] = useState("garage");
  const [mostrarModal, setMostrarModal] = useState(false);
  const [vehicleToEdit, setVehicleToEdit] = useState(null);
  const {
    data: vehicles = [],
    isPending,
    isError,
    error,
  } = useQuery({
    queryKey: ["vehicles"],
    queryFn: fetchVehicles,
  });
  const [modalType, setModalType] = useState(null);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const openFacturaModal = (vehicle) => {
    setSelectedVehicle(vehicle);
    setModalType("factura");
  };

  const openGasolinaModal = (vehicle) => {
    setSelectedVehicle(vehicle);
    setModalType("gasoil");
  };

  const closeModal = () => {
    setModalType(null);
    setSelectedVehicle(null);
  };
  console.log(vehicles);

  function abrirModal() {
    setVehicleToEdit(null);
    setMostrarModal(true);
  }
  function abrirModalEditar(vehicle) {
    setVehicleToEdit(vehicle);
    setMostrarModal(true);
  }
  function cerrarModal() {
    setMostrarModal(false);
    setVehicleToEdit(null);
  }
  return (
    <>
      <Navbar pageSelected={pageSelected} setPageSelected={setPageSelected} />
      <div className="bodyGarage">
        <div className="garage">
          <div className="garage__header">
            <div>
              <h1>Mi Garaje Virtual</h1>
              <p>Gestiona tus vehículos y su estado</p>
            </div>

            <button
              onClick={() =>
                mostrarModal === false ? abrirModal() : cerrarModal()
              }
            >
              + Añadir Vehículo
            </button>
          </div>
          {mostrarModal && (
            <ModalForm
              onClose={cerrarModal}
              userId={1}
              vehicleToEdit={vehicleToEdit}
            />
          )}

          <div className="garage__stats">
            <StatsCard type="total" value={3} />
            <StatsCard type="disponible" value={2} />
            <StatsCard type="taller" value={1} />
          </div>

          <div className="garage__vehicles">
            {isPending && <p>Cargando vehículos...</p>}
            {isError && <p>{error.message}</p>}
            {vehicles.map((vehicle) => (
              <VehicleCard
                vehicle={vehicle}
                key={vehicle.id}
                onClickFactura={() => openFacturaModal(vehicle)}
                onClickGasolina={() => openGasolinaModal(vehicle)}
                onClickEditar={() => abrirModalEditar(vehicle)}
              />
            ))}
          </div>
        </div>
      </div>
      {modalType && selectedVehicle && (
        <AddModal
          type={modalType}
          userId={selectedVehicle.userId}
          vehicleId={selectedVehicle.id}
          onClose={closeModal}
        />
      )}
    </>
  );
}

export default GaragePage;
