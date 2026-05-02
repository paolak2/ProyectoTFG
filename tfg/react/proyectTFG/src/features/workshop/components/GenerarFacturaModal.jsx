import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  API_TALLER_FACTURACION_URL,
  API_TALLER_FACTURACION_VEHICLES_URL,
} from "../../../constantes/constantes";
import useWorkshopAuth from "../context/useWorkshopAuth";
import { buildWorkshopInvoicePdf } from "../utils/buildWorkshopInvoicePdf";

function lineKey() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function defaultLinesFromVehicle(vehicle, priceByServiceId) {
  const lines = [];
  const sid = vehicle.taller?.serviceId;
  if (sid != null && priceByServiceId.has(sid)) {
    const p = priceByServiceId.get(sid);
    lines.push({
      key: lineKey(),
      serviceId: sid,
      name: p.name,
      quantity: 1,
      unitPriceExVat: p.priceExVat,
    });
  }
  for (const add of vehicle.taller?.additionalServices ?? []) {
    const id = add.serviceId;
    if (id != null && priceByServiceId.has(id)) {
      const p = priceByServiceId.get(id);
      lines.push({
        key: lineKey(),
        serviceId: id,
        name: p.name,
        quantity: 1,
        unitPriceExVat: p.priceExVat,
      });
    }
  }
  return lines;
}

function GenerarFacturaModal({ services, ivaRate, issuer, onClose, onCreated }) {
  const { authFetch } = useWorkshopAuth();
  const [vehicleId, setVehicleId] = useState("");
  const [lines, setLines] = useState([]);
  const [addServiceId, setAddServiceId] = useState("");
  const [extraName, setExtraName] = useState("");
  const [extraPrice, setExtraPrice] = useState("");
  const [error, setError] = useState(null);
  const [sending, setSending] = useState(false);

  const priceByServiceId = useMemo(() => {
    const m = new Map();
    for (const s of services) {
      m.set(s.id, { name: s.name, priceExVat: s.priceExVat });
    }
    return m;
  }, [services]);

  const { data: vehicles = [], isPending: vehPending } = useQuery({
    queryKey: ["taller-facturacion-vehicles"],
    queryFn: async () => {
      const res = await authFetch(API_TALLER_FACTURACION_VEHICLES_URL);
      if (!res.ok) {
        throw new Error("No se pudieron cargar los vehículos en taller");
      }
      return res.json();
    },
  });

  useEffect(() => {
    if (vehicles.length && !vehicleId) {
      setVehicleId(String(vehicles[0].id));
    }
  }, [vehicles, vehicleId]);

  useEffect(() => {
    if (!vehicleId) {
      setLines([]);
      return;
    }
    const v = vehicles.find((x) => String(x.id) === String(vehicleId));
    if (!v) {
      return;
    }
    setLines(defaultLinesFromVehicle(v, priceByServiceId));
  }, [vehicleId, vehicles, priceByServiceId]);

  const totals = useMemo(() => {
    const base = lines.reduce(
      (s, l) => s + Number(l.quantity || 1) * Number(l.unitPriceExVat || 0),
      0,
    );
    const baseR = Math.round(base * 100) / 100;
    const iva = Math.round(baseR * ivaRate * 100) / 100;
    const total = Math.round((baseR + iva) * 100) / 100;
    return { base: baseR, iva, total };
  }, [lines, ivaRate]);

  function addCatalogLine() {
    const sid = Number(addServiceId);
    if (!sid || !priceByServiceId.has(sid)) {
      return;
    }
    const p = priceByServiceId.get(sid);
    setLines((prev) => [
      ...prev,
      {
        key: lineKey(),
        serviceId: sid,
        name: p.name,
        quantity: 1,
        unitPriceExVat: p.priceExVat,
      },
    ]);
  }

  function addExtraLine() {
    const name = extraName.trim();
    const price = Number(extraPrice);
    if (!name || Number.isNaN(price) || price < 0) {
      return;
    }
    setLines((prev) => [
      ...prev,
      {
        key: lineKey(),
        serviceId: null,
        name,
        quantity: 1,
        unitPriceExVat: Math.round(price * 100) / 100,
      },
    ]);
    setExtraName("");
    setExtraPrice("");
  }

  function updateLine(key, patch) {
    setLines((prev) =>
      prev.map((l) => (l.key === key ? { ...l, ...patch } : l)),
    );
  }

  function removeLine(key) {
    setLines((prev) => prev.filter((l) => l.key !== key));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    if (!vehicleId) {
      setError("Selecciona un vehículo");
      return;
    }
    if (!lines.length) {
      setError("Añade al menos una línea");
      return;
    }
    const payloadLines = lines.map((l) =>
      l.serviceId != null
        ? {
            serviceId: l.serviceId,
            quantity: Number(l.quantity) || 1,
            unitPriceExVat: l.unitPriceExVat,
          }
        : {
            serviceId: null,
            name: l.name,
            quantity: Number(l.quantity) || 1,
            unitPriceExVat: l.unitPriceExVat,
          },
    );
    setSending(true);
    try {
      const res = await authFetch(API_TALLER_FACTURACION_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vehicleId: Number(vehicleId),
          lines: payloadLines,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.message || "No se pudo crear la factura");
      }
      buildWorkshopInvoicePdf(data, issuer);
      onCreated?.();
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="modal-overlay" role="presentation" onClick={onClose}>
      <div
        className="modal-new-vehicle facturacion-modal"
        role="dialog"
        aria-labelledby="gen-fact-title"
        onClick={(ev) => ev.stopPropagation()}
      >
        <button type="button" className="close-btn" onClick={onClose}>
          ×
        </button>
        <h2 id="gen-fact-title">Generar factura</h2>
        <p className="workshop-modal-hint">
          Precios sin IVA (por defecto desde el catálogo; puedes editarlos). IVA:{" "}
          {(ivaRate * 100).toFixed(0)} %.
        </p>

        {vehPending && <p>Cargando vehículos...</p>}

        <form className="form workshop-modal-form" onSubmit={handleSubmit}>
          <label>
            Vehículo en taller
            <select
              value={vehicleId}
              onChange={(e) => setVehicleId(e.target.value)}
              required
              disabled={!vehicles.length}
            >
              {!vehicles.length ? (
                <option value="">No hay vehículos en el taller</option>
              ) : (
                vehicles.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.plate} · {v.brandName} {v.modelName}
                  </option>
                ))
              )}
            </select>
          </label>

          <div className="facturacion-lines">
            <h3 className="facturacion-lines__title">Líneas</h3>
            {lines.map((l) => (
              <div key={l.key} className="facturacion-line">
                <span className="facturacion-line__name">{l.name}</span>
                <label>
                  Ud.
                  <input
                    type="number"
                    min={1}
                    value={l.quantity}
                    onChange={(e) =>
                      updateLine(l.key, {
                        quantity: Math.max(1, Number(e.target.value) || 1),
                      })
                    }
                  />
                </label>
                <label>
                  P. unit. s/IVA
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    value={l.unitPriceExVat}
                    onChange={(e) =>
                      updateLine(l.key, {
                        unitPriceExVat: Number(e.target.value),
                      })
                    }
                  />
                </label>
                <button
                  type="button"
                  className="facturacion-line__remove"
                  onClick={() => removeLine(l.key)}
                >
                  Quitar
                </button>
              </div>
            ))}
          </div>

          <div className="facturacion-add-row">
            <label>
              Añadir servicio
              <select
                value={addServiceId}
                onChange={(e) => setAddServiceId(e.target.value)}
              >
                <option value="">—</option>
                {services.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({Number(s.priceExVat).toFixed(2)} € s/IVA)
                  </option>
                ))}
              </select>
            </label>
            <button type="button" onClick={addCatalogLine}>
              Añadir
            </button>
          </div>

          <div className="facturacion-add-row facturacion-add-row--extra">
            <label>
              Extra / urgencia (concepto)
              <input
                value={extraName}
                onChange={(e) => setExtraName(e.target.value)}
                placeholder="Ej. sustitución pieza"
              />
            </label>
            <label>
              Importe s/IVA
              <input
                type="number"
                min={0}
                step="0.01"
                value={extraPrice}
                onChange={(e) => setExtraPrice(e.target.value)}
              />
            </label>
            <button type="button" onClick={addExtraLine}>
              Añadir extra
            </button>
          </div>

          <div className="facturacion-totals">
            <p>
              Base imponible: <strong>{totals.base.toFixed(2)} €</strong>
            </p>
            <p>
              IVA ({(ivaRate * 100).toFixed(0)} %):{" "}
              <strong>{totals.iva.toFixed(2)} €</strong>
            </p>
            <p>
              Total: <strong>{totals.total.toFixed(2)} €</strong>
            </p>
          </div>

          {error && <p className="workshop-modal-error">{error}</p>}

          <div className="workshop-modal-actions">
            <button
              type="button"
              className="workshop-btn-secondary"
              onClick={onClose}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="modal-form-btn modal-form-btn--primary"
              disabled={sending || !vehicles.length}
            >
              {sending ? "Generando…" : "Crear factura y PDF"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default GenerarFacturaModal;
