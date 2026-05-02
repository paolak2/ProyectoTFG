import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "./AuthContext";
import RegisterModal from "./RegisterModal";
import BaseNavbar from "../../compartidos/components/BaseNavbar";

function LoginPage() {
  const { login, user, isLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from || "/garage";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [showRegister, setShowRegister] = useState(false);

  useEffect(() => {
    if (!isLoading && user) {
      if (user.role === "cliente") {
        navigate("/garage", { replace: true });
      } else {
        navigate("/taller/panel", { replace: true });
      }
    }
  }, [isLoading, user, navigate]);

  if (isLoading || user) {
    return <p className="auth-loading">Cargando...</p>;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const u = await login(email, password);
      if (u.role === "cliente") {
        navigate(from.startsWith("/taller") ? "/garage" : from, {
          replace: true,
        });
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
    <div className="auth-page">
      <BaseNavbar
        links={[]}
        rightSlot={
          <button
            type="button"
            className="navbar__register-btn"
            onClick={() => setShowRegister(true)}
          >
            Registrarse
          </button>
        }
      />

      <main className="auth-main">
        <div className="auth-card">
          <h1>Iniciar sesión</h1>
          <p className="auth-sub">Accede a tu garaje o al panel del taller</p>
          <form className="auth-form" onSubmit={handleSubmit}>
            <label>
              Email
              <input
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </label>
            <label>
              Contraseña
              <input
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </label>
            {error && <p className="auth-error">{error}</p>}
            <button type="submit" disabled={submitting}>
              {submitting ? "Entrando…" : "Entrar"}
            </button>
          </form>
          <p className="auth-hint">
            Demo cliente: <strong>carlos@autolink.demo</strong> / Demo1234
            <br />
            Demo admin taller: <strong>marta@autolink.demo</strong> / Demo1234
            <br />
            Demo empleado: <strong>diego@autolink.demo</strong> / Demo1234
            <br />
            Demo admin taller 2: <strong>pedro@motorplus.demo</strong> / Demo1234
          </p>
        </div>
      </main>

      {showRegister && (
        <RegisterModal onClose={() => setShowRegister(false)} />
      )}
    </div>
  );
}

export default LoginPage;
