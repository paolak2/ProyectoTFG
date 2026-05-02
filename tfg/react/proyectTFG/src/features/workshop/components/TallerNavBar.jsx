import BaseNavbar from "../../../compartidos/components/BaseNavbar";
import { useAuth } from "../../auth/AuthContext";

function TallerNavBar({ role }) {
  const { user, logout } = useAuth();
  const roleLink =
    role === "admin"
      ? { to: "/taller/facturacion", label: "Facturación" }
      : { to: "/taller/ver-facturas", label: "Ver facturas" };

  const links = [
    { to: "/taller/panel", label: "Panel taller" },
    ...(role === "admin"
      ? [{ to: "/taller/citas", label: "Próximas citas" }]
      : []),
    { label: "Chat", disabled: true },
    roleLink,
  ];

  return (
    <BaseNavbar
      links={links}
      subtitle="Gestion interna del taller"
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

export default TallerNavBar;
