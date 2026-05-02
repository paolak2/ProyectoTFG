import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";

import Navbar from "../components/navBar";
import StatsCard from "../components/StatsCard";
import VehicleCard from "../components/VehicleCard";
import ModalForm from "../components/modalForm";
import AddModal from "../components/AddModal";
import { API_VEHICLES_URL } from "../../../constantes/constantes";
import CitaSolicitudModal from "../components/CitaSolicitudModal";
import { useAuth } from "../../auth/AuthContext";

function GaragePage() {
  const queryClient = useQueryClient();
  const { user, authFetch } = useAuth();
  const [mostrarModal, setMostrarModal] = useState(false);
  const [vehicleToEdit, setVehicleToEdit] = useState(null);
  const [citaVehicle, setCitaVehicle] = useState(null);
  const {
    data: vehicles = [],
    isPending,
    isError,
    error,
  } = useQuery({
    queryKey: ["vehicles", user?.id],
    queryFn: async () => {
      const res = await authFetch(API_VEHICLES_URL);
      if (!res.ok) {
        throw new Error("Error al obtener vehículos");
      }
      return res.json();
    },
    enabled: Boolean(user?.id),
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
  const total = vehicles.length;
  const disponibles = vehicles.filter((v) => v.status === "Disponible").length;
  const enTaller = vehicles.filter(
    (v) => v.status === "En Taller" || v.status === "Pendiente Recogida",
  ).length;

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
      <Navbar />
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
              key={vehicleToEdit?.id ?? "nuevo"}
              onClose={cerrarModal}
              userId={user.id}
              vehicleToEdit={vehicleToEdit}
            />
          )}

          <div className="garage__stats">
            <StatsCard type="total" value={total} />
            <StatsCard type="disponible" value={disponibles} />
            <StatsCard type="taller" value={enTaller} />
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
                onSolicitarCita={(v) => setCitaVehicle(v)}
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
      {citaVehicle && (
        <CitaSolicitudModal
          mode="garage"
          fixedVehicle={citaVehicle}
          fixedWorkshop={null}
          vehiclesDisponibles={[]}
          onClose={() => setCitaVehicle(null)}
          onSuccess={() => {
            queryClient.invalidateQueries({
              queryKey: ["vehicles", user.id],
            });
          }}
        />
      )}
    </>
  );
}

export default GaragePage;
