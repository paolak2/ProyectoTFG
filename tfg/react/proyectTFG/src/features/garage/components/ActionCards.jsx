const PRESET_CONFIG = {
  factura: {
    title: "Agregar Factura",
    icon: "bi bi-receipt-cutoff",
    details: "Registra mantenimiento y reparaciones",
    class: "",
  },
  gasoil: {
    title: "Agregar Gasoil",
    icon: "bi bi-fuel-pump",
    details: "Registra repostajes y combustible",
    class: "",
  },
};

function ActionCards({
  type,
  title,
  icon,
  details,
  onClick,
  className = "",
  total = "",
  date = "",
}) {
  const preset = type ? PRESET_CONFIG[type] : null;
  const finalTitle = title ?? preset?.title ?? "";
  const finalIcon = icon ?? preset?.icon ?? "";
  const finalDetails = details ?? preset?.details ?? "";
  const finalClass = className ?? preset?.className ?? "";

  return (
    <article className={`${finalClass}`}>
      {finalClass === "action" && (
        <button className="action-add" aria-label="Agregar" onClick={onClick}>
          +
        </button>
      )}
      {finalClass === "historial" && total && (
        <span className="action-historial" aria-label="Agregar">
          ${total}
        </span>
      )}
      <i className={`${finalIcon}`}></i>
      <h2>{`${finalTitle}`}</h2>
      <p>{`${finalDetails}`}</p>
      {finalClass === "historial" && date && (
        <div className="fecha">
          <i className="bi bi-calendar-check"></i>
          <p>{date}</p>
        </div>
      )}
    </article>
  );
}

export default ActionCards;
