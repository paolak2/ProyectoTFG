const PRESET_CONFIG = {
  total: {
    title: "Total Vehículos",
    icon: "bi bi-car-front",
    variant: "primary",
    class: "total",
  },
  disponible: {
    title: "Disponibles",
    icon: "bi bi-check-circle",
    variant: "success",
    class: "disponible",
  },
  taller: {
    title: "En Taller",
    icon: "bi bi-tools",
    variant: "warning",
    class: "taller",
  },
  gastos: {
    title: "Gastos Totales",
    icon: "bi bi-currency-dollar",
    variant: "neutral",
  },
  facturas: {
    title: "Facturas",
    icon: "bi bi-receipt",
    variant: "neutral",
  },
  gasolina: {
    title: "Gasolina",
    icon: "bi bi-fuel-pump",
    variant: "neutral",
  },
  ordenesActivas: {
    title: "Órdenes activas",
    icon: "bi bi-clipboard-check",
    variant: "primary",
    class: "total",
  },
  vehiculosEspera: {
    title: "Vehículos en espera",
    icon: "bi bi-hourglass-split",
    variant: "warning",
    class: "taller",
  },
  entregasHoy: {
    title: "Entregas hoy",
    icon: "bi bi-truck",
    variant: "success",
    class: "disponible",
  },
  facturacionEmitidas: {
    title: "Facturas emitidas (mes)",
    icon: "bi bi-receipt-cutoff",
    variant: "primary",
    class: "total",
  },
  facturacionImporte: {
    title: "Importe total (con IVA)",
    icon: "bi bi-currency-euro",
    variant: "neutral",
    class: "total",
  },
  facturacionPagadas: {
    title: "Facturas pagadas",
    icon: "bi bi-check2-circle",
    variant: "success",
    class: "disponible",
  },
  facturacionPorPagar: {
    title: "Por pagar (importe con IVA)",
    icon: "bi bi-hourglass-split",
    variant: "warning",
    class: "taller",
  },
};

function StatsCard({ type, title, value, icon, variant, className = "" }) {
  const preset = type ? PRESET_CONFIG[type] : null;
  const finalTitle = title ?? preset?.title ?? "";
  const finalIcon = icon ?? preset?.icon ?? "bi bi-circle";
  const finalVariant = variant ?? preset?.variant ?? "neutral";
  const finalClass = preset?.class ?? "";

  return (
    <article className={`stats-card stats-card--${finalVariant} ${className}`}>
      <div className={`card-icon card-icon-${finalClass}`}>
        <i className={finalIcon}></i>
      </div>

      <div className="card-info">
        <p className="card-title">{finalTitle}</p>
        <p className="card-value">{value}</p>
      </div>
    </article>
  );
}

export default StatsCard;
