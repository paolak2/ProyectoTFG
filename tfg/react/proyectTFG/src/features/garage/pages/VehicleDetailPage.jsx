import { useParams } from "react-router-dom";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { API_VEHICLE_URL } from "../../../constantes/constantes";
import Navbar from "../components/navBar";
import StatsCard from "../components/StatsCard";
import AddModal from "../components/AddModal";
import ActionCards from "../components/ActionCards";

function VehicleDetailPage() {
  const queryClient = useQueryClient();
  const { id, userId } = useParams();
  const [pageSelected, setPageSelected] = useState("garage-detail");

  const [isFacturaModalOpen, setIsFacturaModalOpen] = useState(false);
  const [isGasolinaModalOpen, setIsGasolinaModalOpen] = useState(false);

  function openFacturaModal() {
    console.log("abriendo modal...");
    setIsFacturaModalOpen(true);
  }
  const closeFacturaModal = () => setIsFacturaModalOpen(false);

  const openGasolinaModal = () => setIsGasolinaModalOpen(true);
  const closeGasolinaModal = () => setIsGasolinaModalOpen(false);

  const AddFactura = async (data) => {
    await fetch(`${API_VEHICLE_URL}/${userId}/${id}/gasoil`, {
      method: "POST",
      body: JSON.stringify(data),
    });

    queryClient.invalidateQueries(["vehicle", userId, id]);
    closeFacturaModal();
  };

  const AddGasolina = async (data) => {
    await fetch(`${API_VEHICLE_URL}/${userId}/${id}/gasoil`, {
      method: "POST",
      body: JSON.stringify(data),
    });

    queryClient.invalidateQueries(["vehicle", userId, id]);
    closeFacturaModal();
  };

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
      <Navbar pageSelected={pageSelected} setPageSelected={setPageSelected} />
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
                    Estado
                  </p>
                  <p>{vehicle.status}</p>
                </div>
              </div>
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
            {isFacturaModalOpen && (
              <AddModal
                type="factura"
                onClose={closeFacturaModal}
                onSubmit={AddFactura}
              />
            )}

            {isGasolinaModalOpen && (
              <AddModal
                type="gasolina"
                onClose={closeGasolinaModal}
                onSubmit={AddGasolina}
              />
            )}
            <div className="details-historial-gasolina">
              <h3>Historial Gasto Gasoil</h3>
              {vehicle.facturas?.historial?.length > 0 ? (
                vehicle.gastoGasolina?.historial?.map((item, index) => (
                  <ActionCards
                    key={index}
                    className="historial"
                    type="historial"
                    title={`${item.litros}L`}
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
    </>
  );
}

export default VehicleDetailPage;
