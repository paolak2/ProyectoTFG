import BaseNavbar from "../../../compartidos/components/BaseNavbar";
import { useAuth } from "../../auth/AuthContext";

const GARAGE_LINKS = [
  { to: "/garage", label: "Garaje" },
  { to: "/talleres", label: "Buscar Talleres" },
  { label: "Chat", disabled: true },
];

function Navbar() {
  const { user, logout } = useAuth();
  return (
    <BaseNavbar
      links={GARAGE_LINKS}
      rightSlot={
        user ? (
          <div className="navbar__session">
            <span className="navbar__user-name">{user.name}</span>
            <button type="button" className="navbar__logout" onClick={logout}>
              Salir
            </button>
          </div>
        ) : null
      }
    />
  );
}

export default Navbar;
