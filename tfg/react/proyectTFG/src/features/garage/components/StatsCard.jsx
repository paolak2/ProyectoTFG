function StatsCard({ type, value }) {
  let title;
  let icon;
  if (type === "total") {
    title = "Total Vehículos";
    icon = "bi bi-car-front";
  } else if (type === "disponible") {
    title = "Disponibles";
    icon = "bi bi-check-circle";
  } else if (type === "taller") {
    title = "En Taller";
    icon = "bi bi-tools";
  }
  return (
    <article className="stats-card">
      <div className={`card-icon card-icon-${type}`}>
        <i className={icon}></i>
      </div>
      <div className="card-info">
        <p className="card-title">{title}</p>
        <p className="card-value">{value}</p>
      </div>
    </article>
  );
}

export default StatsCard;
