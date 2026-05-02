import RepairStatus from "./RepairStatus";
import { useNavigate } from "react-router-dom";

function VehicleCard({
  vehicle,
  onClickFactura,
  onClickGasolina,
  onClickEditar,
  onSolicitarCita,
}) {
  const navigate = useNavigate();
  const rutaDetalles = `/vehicle/${vehicle.userId}/${vehicle.id}`;

  const puedeSolicitarCita =
    vehicle.status === "Disponible" && !vehicle.solicitudCita;

  const statusClass = vehicle.status
    .toLowerCase()
    .replace(/\s/g, "-");

  return (
    <article>
      <div className="vehicle-header">
        <div className="vehicle-image">
          {vehicle.ruta ? (
            <img src={vehicle.ruta} alt={vehicle.brandName} />
          ) : (
            <i className="bi bi-ev-front-fill"></i>
          )}
        </div>
        <div className="vehicle-model">
          <h4>{vehicle.brandName}</h4>
          <h5>{vehicle.modelName}</h5>
          <p>{vehicle.plate}</p>
        </div>
        <div className={`vehicle-status vehicle-status-${statusClass}`}>
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
          {vehicle.status}
        </div>
      </div>

      {vehicle.citaRechazoMensaje && (
        <p className="cita-rechazo-msg" role="alert">
          {vehicle.citaRechazoMensaje}
        </p>
      )}

      {vehicle.solicitudCita?.fase === "pendiente" && (
        <p className="cita-banner cita-banner--info">
          Solicitud enviada. El taller la está revisando.
        </p>
      )}
      {vehicle.solicitudCita?.fase === "aceptada" && (
        <p className="cita-banner cita-banner--ok">
          Cita aceptada. En breve te indicarán la fecha de ingreso.
        </p>
      )}

      <div className="vehicle-details">
        <p>
          Año: <strong>{vehicle.year}</strong>
        </p>
        <p>
          Color:<strong>{vehicle.color}</strong>
        </p>
      </div>

      {vehicle.status === "Cita programada" && vehicle.citaFechaEntrada && (
        <section className="cita-programada-resumen">
          <p>
            <i className="bi bi-calendar-check"></i>
            <strong>Fecha prevista de entrada al taller:</strong>{" "}
            {vehicle.citaFechaEntrada}
          </p>
        </section>
      )}

      {vehicle.status === "En Taller" && vehicle.taller && (
        <RepairStatus
          workshop={vehicle.taller.name}
          entryDate={vehicle.taller.entryDate}
          estimatedFinish={vehicle.taller.estimatedFinish}
          exitDate={vehicle.taller.exitDate}
          service={vehicle.taller.servicio}
        />
      )}
      <div className="vehicle-footer">
        {vehicle.status === "En Taller" && <button type="button">Contactar Taller</button>}
        {puedeSolicitarCita && (
          <button type="button" onClick={() => onSolicitarCita?.(vehicle)}>
            Solicitar cita
          </button>
        )}
        <div className="vehicle-buttons">
          <button type="button" onClick={() => navigate(rutaDetalles)}>
            Ver Detalles
          </button>
          <button type="button" onClick={onClickEditar}>
            Editar
          </button>
          <button type="button" onClick={onClickGasolina}>
            Añadir Gasolina
          </button>
          <button type="button" onClick={onClickFactura}>
            Añadir Factura
          </button>
        </div>
      </div>
    </article>
  );
}

export default VehicleCard;
