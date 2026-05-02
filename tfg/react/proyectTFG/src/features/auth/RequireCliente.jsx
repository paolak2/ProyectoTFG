import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "./AuthContext";

function RequireCliente({ children }) {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <p className="auth-loading">Cargando sesión...</p>;
  }

  if (!user || user.role !== "cliente") {
    return (
      <Navigate to="/login" replace state={{ from: location.pathname }} />
    );
  }

  return children;
}

export default RequireCliente;
