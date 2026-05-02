function ContactOwnerModal({ owner, onClose }) {
  if (!owner) {
    return null;
  }

  return (
    <div className="modal-overlay" role="presentation" onClick={onClose}>
      <div
        className="modal-new-vehicle modal-new-vehicle--compact"
        role="dialog"
        aria-labelledby="contact-owner-title"
        onClick={(e) => e.stopPropagation()}
      >
        <button type="button" className="close-btn" onClick={onClose}>
          ×
        </button>
        <h2 id="contact-owner-title">Contactar propietario</h2>
        <p className="workshop-modal-hint">
          Datos del cliente para esta orden.
        </p>
        <div className="workshop-modal-fields">
          <p>
            <strong>Teléfono</strong>
            <br />
            <a href={`tel:${owner.phone?.replace(/\s/g, "")}`}>
              {owner.phone}
            </a>
          </p>
          <p>
            <strong>Email</strong>
            <br />
            <a href={`mailto:${owner.email}`}>{owner.email}</a>
          </p>
        </div>
        <button type="button" className="workshop-btn-secondary" disabled>
          Abrir chat (próximamente)
        </button>
      </div>
    </div>
  );
}

export default ContactOwnerModal;
