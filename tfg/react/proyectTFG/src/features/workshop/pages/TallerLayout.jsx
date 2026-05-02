import { Outlet } from "react-router-dom";
import TallerNavBar from "../components/TallerNavBar";
import useWorkshopAuth from "../context/useWorkshopAuth";

function TallerLayout() {
  const { role, isLoading, error } = useWorkshopAuth();

  if (isLoading) {
    return <p>Cargando sesion del taller...</p>;
  }

  if (error) {
    return <p>{error}</p>;
  }

  return (
    <>
      <TallerNavBar role={role} />
      <div className="bodyGarage">
        <div className="garage">
          <Outlet />
        </div>
      </div>
    </>
  );
}

export default TallerLayout;
