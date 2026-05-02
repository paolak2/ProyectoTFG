import { useParams } from "react-router-dom";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { API_VEHICLE_URL } from "../../../constantes/constantes";
import { useAuth } from "../../auth/AuthContext";
import Navbar from "../components/navBar";
import StatsCard from "../components/StatsCard";
import AddModal from "../components/AddModal";
import ActionCards from "../components/ActionCards";

function VehicleDetailPage() {
  const { authFetch } = useAuth();
  const { id: vehicleId, userId } = useParams();
  const [modalType, setModalType] = useState(null);

  const openFacturaModal = () => setModalType("factura");
  const openGasolinaModal = () => setModalType("gasoil");
  const closeModal = () => setModalType(null);

  const {
    data: vehicle,
    isPending,
    isError,
    error,
  } = useQuery({
    queryKey: ["vehicle", userId, vehicleId],
    queryFn: async () => {
      const res = await authFetch(
        `${API_VEHICLE_URL}/${userId}/${vehicleId}`,
      );
      if (!res.ok) {
        throw new Error("Error al obtener el vehículo");
      }

      return res.json();
    },
  });

  if (isPending) {
    return (
      <>
        <Navbar />
        <div className="detail">
          <p>Cargando...</p>
        </div>
      </>
    );
  }

  if (isError) {
    return (
      <>
        <Navbar />
        <div className="detail">
          <p>Error: {error?.message}</p>
        </div>
      </>
    );
  }

  const totalFacturas =
    vehicle.facturas?.historial?.reduce(
      (acc, factura) => acc + factura.total,
      0,
    ) || 0;

  const totalGasolina =
    vehicle.gastoGasolina?.historial?.reduce(
      (acc, item) => acc + item.monto,
      0,
    ) || 0;

  const totalGastos = totalFacturas + totalGasolina;
  return (
    <>
      <Navbar />
      <div className="detail">
        <div className="vehicleDetail-page">
          <section className="vehicleHero">
            <div className="vehicleHero__image">
              {vehicle.ruta != null ? (
                <img
                  src={vehicle.ruta}
                  alt={`${vehicle.brandName} ${vehicle.modelName}`}
                />
              ) : (
                <div className="vehicleHero__placeholder">
                  <i className="bi bi-ev-front-fill"></i>
                </div>
              )}
              <div className="vehicleHero__overlay" />
              <div className="vehicleHero__info">
                <h1>
                  {vehicle.brandName} - {vehicle.modelName}
                </h1>
                <p>Matrícula: {vehicle.plate}</p>
              </div>
            </div>
          </section>
        </div>

        <section className="vehicleContent">
          <div className="cardInfo">
            <div className="info-vehicle">
              <h4>Información General</h4>
              <div className="infoGrid">
                <div className="info">
                  <p>
                    <i className="bi bi-car-front"></i> Modelo{" "}
                  </p>
                  <p>
                    {vehicle.brandName} {vehicle.modelName} ({vehicle.year})
                  </p>
                </div>
                {vehicle.color != null && (
                  <div className="info">
                    <p>
                      <i className="bi bi-palette"></i> Color
                    </p>
                    <p>{vehicle.color}</p>
                  </div>
                )}
                {vehicle.mileage != null && (
                  <div className="info">
                    <p>
                      <i className="bi bi-arrow-up-right-square"></i>{" "}
                      Kilometraje
                    </p>
                    <p>{vehicle.mileage}</p>
                  </div>
                )}
                {vehicle.insuranceName != null && (
                  <div className="info">
                    <p>
                      <i className="bi bi-shield"></i>Aseguradora
                    </p>
                    <p>{vehicle.insuranceName}</p>
                  </div>
                )}
                {vehicle.insuranceNumber != null && (
                  <div className="info">
                    <p>
                      <i className="bi bi-shield-check"></i>Póliza
                    </p>
                    <p>{vehicle.insuranceNumber}</p>
                  </div>
                )}
                <div className="info">
                  <p>
                    {vehicle.status === "En Taller" && (
                      <i className="bi bi-exclamation-triangle"></i>
                    )}
                    {vehicle.status === "Disponible" && (
                      <i className="bi bi-check-circle"></i>
                    )}
                    {vehicle.status === "Pendiente Recogida" && (
                      <i className="bi bi-clock"></i>
                    )}
                    {vehicle.status === "Cita programada" && (
                      <i className="bi bi-calendar-event"></i>
                    )}
                    Estado
                  </p>
                  <p>{vehicle.status}</p>
                </div>
              </div>
              {vehicle.status === "Cita programada" &&
                vehicle.citaFechaEntrada && (
                  <div className="info-vehicle cita-programada-resumen">
                    <p>
                      <i className="bi bi-calendar-check"></i> Entrada prevista
                      al taller
                    </p>
                    <p>{vehicle.citaFechaEntrada}</p>
                  </div>
                )}
              {vehicle.taller != null && (
                <div className="service">
                  <div className="info">
                    <p>Revision:</p>
                    <p>{vehicle.taller.servicio}</p>
                  </div>
                  <div className="info">
                    <p>Taller:</p>
                    <p>{vehicle.taller.name}</p>
                  </div>
                  <div className="info">
                    <p>Fecha de entrada: </p>
                    <p>{vehicle.taller.entryDate}</p>
                  </div>
                  <div className="info">
                    <p>Fecha Estimada Salida:</p>
                    <p>{vehicle.taller.estimatedFinish}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
          <div className="details-stats">
            <StatsCard type="gastos" value={totalGastos}></StatsCard>
            <StatsCard
              type="facturas"
              value={
                vehicle.facturas?.totalGlobalAnyo
                  ? vehicle.facturas.totalGlobalAnyo
                  : 0
              }
            ></StatsCard>
            <StatsCard
              type="gasolina"
              value={
                vehicle.gastoGasolina?.totalUltimoMes
                  ? vehicle.gastoGasolina.totalUltimoMes
                  : 0
              }
            ></StatsCard>
          </div>
          <div className="details-actionCards">
            <ActionCards
              className="action"
              type={"factura"}
              onClick={openFacturaModal}
            ></ActionCards>
            <ActionCards
              className="action"
              type={"gasoil"}
              onClick={openGasolinaModal}
            ></ActionCards>
          </div>
          <div className="details-historial">
            <div className="details-historial-facturas">
              <h3>Historial Facturas</h3>
              {vehicle.facturas?.historial?.length > 0 ? (
                vehicle.facturas.historial.map((factura, index) => (
                  <ActionCards
                    key={index}
                    className="historial"
                    type="historial"
                    title={factura.name}
                    total={factura.total}
                    date={factura.date}
                  />
                ))
              ) : (
                <ActionCards
                  className="historial"
                  type="historial"
                  details={"No hay datos registrados"}
                />
              )}
            </div>

            <div className="details-historial-gasolina">
              <h3>Historial Gasto Gasoil</h3>
              {vehicle.gastoGasolina?.historial?.length > 0 ? (
                vehicle.gastoGasolina.historial.map((item, index) => (
                  <ActionCards
                    key={index}
                    className="historial"
                    type="historial"
                    title={item.litros ? `${item.litros}L` : "Sin litros"}
                    total={item.monto}
                    date={item.date}
                  />
                ))
              ) : (
                <ActionCards
                  className="historial"
                  type="historial"
                  details={"No hay datos registrados"}
                />
              )}
            </div>
          </div>
        </section>
      </div>
      {modalType && (
        <AddModal
          type={modalType}
          userId={userId}
          vehicleId={vehicleId}
          onClose={closeModal}
        />
      )}
    </>
  );
}

export default VehicleDetailPage;
