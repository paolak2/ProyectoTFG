import { Navigate } from "react-router-dom";
import { useAuth } from "../../auth/AuthContext";

function RequireWorkshopRole({ allowedRole, children }) {
  const { user, isLoading, error } = useAuth();
  const role = user?.role ?? null;

  if (isLoading) {
    return <p>Cargando sesion del taller...</p>;
  }

  if (error) {
    return <p>{error}</p>;
  }

  if (role !== allowedRole) {
    return <Navigate to="/taller/panel" replace />;
  }

  return children;
}

export default RequireWorkshopRole;
