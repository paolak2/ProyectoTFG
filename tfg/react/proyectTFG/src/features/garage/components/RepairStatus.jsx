function RepairStatus({
  workshop,
  entryDate,
  estimatedFinish,
  exitDate,
  service,
  repairPhaseLabel,
}) {
  return (
    <section className="repair-status">
      <div className="repair-status-details">
        <p>
          <i className="bi bi-wrench-adjustable"></i>
          <strong>Estado de Reparación</strong>
        </p>
        {repairPhaseLabel && (
          <p>
            <i className="bi bi-activity"></i>
            <strong>Situación:</strong> {repairPhaseLabel}
          </p>
        )}
        <p>
          <i className="bi bi-geo-alt"></i>
          <strong>Taller:</strong> {workshop}
        </p>
        <p>
          <i className="bi bi-calendar4"></i>
          <strong>Fecha de entrada:</strong> {entryDate}
        </p>
        <p>
          <i className="bi bi-clock"></i>
          <strong>Finalización estimada:</strong> {estimatedFinish}
        </p>
        {exitDate && (
          <p>
            <i className="bi bi-calendar-check"></i>
            <strong>Fecha de salida:</strong> {exitDate}
          </p>
        )}
      </div>
      <div className="repair-status-service">
        <p>
          <i className="bi bi-gear"></i>
          <strong>Servicio:</strong> {service}
        </p>
      </div>
    </section>
  );
}

export default RepairStatus;
