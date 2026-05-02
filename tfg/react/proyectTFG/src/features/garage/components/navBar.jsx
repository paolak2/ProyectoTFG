import BaseNavbar from "../../../compartidos/components/BaseNavbar";

const GARAGE_LINKS = [
  { to: "/", label: "Garaje" },
  { to: "/talleres", label: "Buscar Talleres" },
];

function Navbar() {
  return <BaseNavbar links={GARAGE_LINKS} />;
}

export default Navbar;
