import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { API_PUBLIC_WORKSHOPS } from "../../constantes/constantes";
import { useAuth } from "./AuthContext";

async function fetchPublicWorkshops() {
  const res = await fetch(API_PUBLIC_WORKSHOPS);
  if (!res.ok) {
    throw new Error("No se pudieron cargar los talleres");
  }
  return res.json();
}

function RegisterModal({ onClose }) {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [accountType, setAccountType] = useState("cliente");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [dni, setDni] = useState("");
  const [password, setPassword] = useState("");
  const [cif, setCif] = useState("");
  const [workshopId, setWorkshopId] = useState("");
  const [workshops, setWorkshops] = useState([]);
  const [loadingWs, setLoadingWs] = useState(false);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (accountType !== "taller") {
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        setLoadingWs(true);
        const list = await fetchPublicWorkshops();
        if (!cancelled) {
          setWorkshops(list);
          if (list[0]) {
            setWorkshopId(String(list[0].id));
          }
        }
      } catch (e) {
        if (!cancelled) {
          setError(e.message);
        }
      } finally {
        if (!cancelled) {
          setLoadingWs(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [accountType]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const payload =
        accountType === "taller"
          ? {
              accountType: "taller",
              name,
              email,
              phone,
              password,
              dni: dni.trim() || undefined,
              cif: cif.trim(),
              workshopId: Number(workshopId),
            }
          : {
              accountType: "cliente",
              name,
              email,
              phone,
              password,
              dni: dni.trim() || undefined,
            };
      const u = await register(payload);
      onClose();
      if (u.role === "cliente") {
        navigate("/garage", { replace: true });
      } else {
        navigate("/taller/panel", { replace: true });
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="modal-overlay" role="presentation" onClick={onClose}>
      <div
        className="modal-new-vehicle"
        role="dialog"
        aria-labelledby="reg-title"
        onClick={(ev) => ev.stopPropagation()}
      >
        <button type="button" className="close-btn" onClick={onClose}>
          ×
        </button>
        <h2 id="reg-title">Crear cuenta Autolink</h2>
        <form className="form auth-register-form" onSubmit={handleSubmit}>
          <label>
            Tipo de cuenta
            <select
              value={accountType}
              onChange={(e) => setAccountType(e.target.value)}
            >
              <option value="cliente">Usuario (mi garaje)</option>
              <option value="taller">Empresa / taller</option>
            </select>
          </label>
          <label>
            Nombre completo
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </label>
          <label>
            Email
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </label>
          <label>
            Teléfono
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
            />
          </label>
          <label>
            DNI (opcional)
            <input value={dni} onChange={(e) => setDni(e.target.value)} />
          </label>
          <label>
            Contraseña
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
            />
          </label>
          {accountType === "taller" && (
            <>
              <label>
                CIF de la empresa
                <input
                  value={cif}
                  onChange={(e) => setCif(e.target.value)}
                  required
                />
              </label>
              <label>
                Taller asociado
                {loadingWs ? (
                  <span> Cargando…</span>
                ) : (
                  <select
                    value={workshopId}
                    onChange={(e) => setWorkshopId(e.target.value)}
                    required
                  >
                    {workshops.map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.name}
                      </option>
                    ))}
                  </select>
                )}
              </label>
              <p className="workshop-modal-hint">
                Se creará un administrador vinculado a ese taller (demo).
              </p>
            </>
          )}
          {error && <p className="auth-error">{error}</p>}
          <div className="workshop-modal-actions">
            <button
              type="button"
              className="workshop-btn-secondary"
              onClick={onClose}
            >
              Cancelar
            </button>
            <button type="submit" disabled={submitting || loadingWs}>
              {submitting ? "Creando…" : "Registrarse"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default RegisterModal;
