import { useNavigate } from "react-router-dom";
import RepairStatus from "../../garage/components/RepairStatus";

const REPAIR_LABELS = {
  en_espera: "En espera",
  en_curso: "En curso",
  finalizada: "Finalizada",
};

function WorkshopVehicleCard({
  vehicle,
  role,
  onContactOwner,
  onEditOrder,
  onAddService,
}) {
  const navigate = useNavigate();
  const owner = vehicle.owner;
  const phase = REPAIR_LABELS[vehicle.taller?.repairStatus] ?? "—";

  return (
    <article className="workshop-vehicle-card">
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
        <div
          className={`vehicle-status vehicle-status-${vehicle.status.toLowerCase().replace(/\s/g, "-")}`}
        >
          {vehicle.status === "En Taller" && (
            <i className="bi bi-exclamation-triangle"></i>
          )}
          {vehicle.status === "Pendiente Recogida" && (
            <i className="bi bi-clock"></i>
          )}
          {vehicle.status}
        </div>
      </div>

      <div className="vehicle-details">
        <p>
          Año: <strong>{vehicle.year}</strong>
        </p>
        <p>
          Color:<strong>{vehicle.color}</strong>
        </p>
        {owner && (
          <>
            <p>
              Propietario: <strong>{owner.name}</strong>
            </p>
            <p>
              Contacto:{" "}
              <strong>
                {owner.phone} · {owner.email}
              </strong>
            </p>
          </>
        )}
        {vehicle.performedByName && (
          <p>
            Mecánico asignado: <strong>{vehicle.performedByName}</strong>
          </p>
        )}
      </div>

      {vehicle.taller && (
        <RepairStatus
          workshop={vehicle.taller.name}
          entryDate={vehicle.taller.entryDate}
          estimatedFinish={vehicle.taller.estimatedFinish}
          exitDate={vehicle.taller.exitDate}
          service={vehicle.serviceName || vehicle.taller.servicio}
          repairPhaseLabel={phase}
        />
      )}

      {vehicle.taller?.additionalServices?.length > 0 && (
        <div className="workshop-extra-services">
          <p>
            <strong>Servicios adicionales</strong>
          </p>
          <ul>
            {vehicle.taller.additionalServices.map((s) => (
              <li key={s.serviceId}>{s.name}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="vehicle-footer">
        <div className="vehicle-buttons workshop-vehicle-buttons">
          <button type="button" onClick={onContactOwner}>
            Contactar dueño
          </button>
          <button type="button" onClick={onEditOrder}>
            Editar orden
          </button>
          <button type="button" onClick={onAddService}>
            Añadir servicios
          </button>
          {role === "admin" ? (
            <button
              type="button"
              onClick={() => navigate("/taller/facturacion")}
            >
              Facturación
            </button>
          ) : (
            <button type="button" disabled title="Solo administración">
              Facturación
            </button>
          )}
        </div>
      </div>
    </article>
  );
}

export default WorkshopVehicleCard;
