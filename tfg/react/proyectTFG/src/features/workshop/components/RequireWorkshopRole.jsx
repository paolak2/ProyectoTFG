import { Navigate } from "react-router-dom";
import useWorkshopAuth from "../context/useWorkshopAuth";

function RequireWorkshopRole({ allowedRole, children }) {
  const { role, isLoading, error } = useWorkshopAuth();

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
