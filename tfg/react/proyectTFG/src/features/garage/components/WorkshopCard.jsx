function WorkshopRatingStars({ rating, maxStars = 5 }) {
  const value = Number(rating);
  const safe = Number.isFinite(value)
    ? Math.min(maxStars, Math.max(0, value))
    : 0;
  const label = `${safe.toLocaleString("es-ES", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  })} / ${maxStars}`;

  const stars = [];
  for (let i = 1; i <= maxStars; i++) {
    if (safe >= i) {
      stars.push(
        <i key={i} className="bi bi-star-fill" aria-hidden="true" />,
      );
    } else if (safe >= i - 0.5) {
      stars.push(
        <i key={i} className="bi bi-star-half" aria-hidden="true" />,
      );
    } else {
      stars.push(<i key={i} className="bi bi-star" aria-hidden="true" />);
    }
  }

  return (
    <div className="workshopCard__rating" role="img" aria-label={label}>
      <span className="workshopCard__rating-stars">{stars}</span>
      <span className="workshopCard__rating-value">
        {safe.toLocaleString("es-ES", {
          minimumFractionDigits: 1,
          maximumFractionDigits: 1,
        })}
        <span className="workshopCard__rating-max">/{maxStars}</span>
      </span>
    </div>
  );
}

function WorkshopCard({ workshop, onContactar }) {
  return (
    <article className="workshopCard">
      <header>
        <div className="workshop-image">
          {workshop.ruta ? (
            <img src={workshop.ruta} alt={workshop.name} />
          ) : (
            <i className="bi bi-tools" aria-hidden="true" />
          )}
        </div>
        <div className="workshop-info">
          <h4>{workshop.name}</h4>
          <p>{workshop.address}</p>
          <p>{workshop.phone}</p>
        </div>
      </header>
      <div className="workshop-status">
        <WorkshopRatingStars rating={workshop.rating} />
        <span className="workshop-status-text">{workshop.status}</span>
      </div>
      <div className="workshop-details">
        <p>
          <strong>Email:</strong> {workshop.email}
        </p>
        <p>
          <strong>Horario:</strong> {workshop.schedule}
        </p>
        <p>
          <strong>Web:</strong>{" "}
          <a href={workshop.website} target="_blank" rel="noreferrer">
            {workshop.website}
          </a>
        </p>
      </div>
      <div className="workshopCard__services">
        {workshop.services?.map((service) => (
          <span key={`${workshop.id}-${service}`}>{service}</span>
        ))}
      </div>
      <div className="workshop-footer">
        <button type="button" onClick={() => onContactar?.(workshop)}>
          Contactar Taller
        </button>
      </div>
    </article>
  );
}

export default WorkshopCard;
