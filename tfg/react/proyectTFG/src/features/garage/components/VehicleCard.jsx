import RepairStatus from "./RepairStatus";

function VehicleCard({ vehicle }) {
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
        <div
          className={`vehicle-status vehicle-status-${vehicle.status.toLowerCase().replace(/\s/g, "-")}`}
        >
          {vehicle.status === "En Taller" && (
            <i className="bi bi-exclamation-triangle"></i>
          )}
          {vehicle.status === "Disponible" && (
            <i className="bi bi-check-circle"></i>
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
      </div>

      {vehicle.status === "En Taller" && (
        <RepairStatus
          workshop={vehicle.taller.name}
          entryDate={vehicle.taller.entryDate}
          estimatedFinish={vehicle.taller.estimatedFinish}
          service={vehicle.taller.servicio}
        />
      )}
      <div className="vehicle-footer">
        {vehicle.estado === "En Taller" && <button>Contactar Taller</button>}
        <div className="vehicle-buttons">
          <button>Ver Detalles</button>
          <button>Añadir Gasto</button>
        </div>
      </div>
    </article>
  );
}

export default VehicleCard;
