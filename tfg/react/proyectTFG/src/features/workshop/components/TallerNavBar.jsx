import BaseNavbar from "../../../compartidos/components/BaseNavbar";

function TallerNavBar({ role }) {
  const roleLink =
    role === "admin"
      ? { to: "/taller/facturacion", label: "Facturación" }
      : { to: "/taller/ver-facturas", label: "Ver facturas" };

  const links = [
    { to: "/taller/panel", label: "Panel taller" },
    { to: "/taller/chat", label: "Chat" },
    roleLink,
  ];

  return <BaseNavbar links={links} subtitle="Gestion interna del taller" />;
}

export default TallerNavBar;
