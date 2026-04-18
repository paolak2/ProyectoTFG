import { Link } from "react-router-dom";
import { useLocation } from "react-router-dom";

function Navbar() {
  const location = useLocation();

  return (
    <div className="navbar">
      <header>
        <div className="marca">
          <div className="logo">
            <i className="bi bi-ev-front-fill"></i>
          </div>
          <div className="nombre">
            <h2>AutoLink</h2>
            <p>Tu gestion propia de vehículos</p>
          </div>
        </div>
        <nav>
          <Link className={location.pathname === "/" ? "selected" : ""} to="/">
            Garaje
          </Link>
          <Link
            className={location.pathname === "/talleres" ? "selected" : ""}
            to="/talleres"
          >
            Buscar Talleres
          </Link>
          {/* <span>Panel Taller</span>  depende del tipo de usuario */}
          <span>Chat</span>
        </nav>
      </header>
    </div>
  );
}

export default Navbar;
