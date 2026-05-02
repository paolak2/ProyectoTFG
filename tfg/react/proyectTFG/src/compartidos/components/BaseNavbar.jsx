import { Link, useLocation } from "react-router-dom";

function BaseNavbar({ links, subtitle = "Tu gestion propia de vehículos" }) {
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
            <p>{subtitle}</p>
          </div>
        </div>
        <nav>
          {links.map((link) => (
            <Link
              key={link.to}
              className={location.pathname === link.to ? "selected" : ""}
              to={link.to}
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </header>
    </div>
  );
}

export default BaseNavbar;
