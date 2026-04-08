function Navbar({ pageSelected, setPageSelected }) {
  console.log("Navbar renderizado con pageSelected:", pageSelected);
  function handleNavClick(page) {
    setPageSelected(page);
    
  }
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
          <span
            className={pageSelected === "garage" ? "selected" : ""}
            onClick={() => handleNavClick("garage")}
          >
            Mi Garaje
          </span>
          <span
            className={pageSelected === "talleres" ? "selected" : ""}
            onClick={() => handleNavClick("talleres")}
          >
            Buscar Talleres
          </span>
          {/* <span>Panel Taller</span>  depende del tipo de usuario */}
          <span
            className={pageSelected === "chat" ? "selected" : ""}
            onClick={() => handleNavClick("chat")}
          >
            Chat
          </span>
        </nav>
      </header>
    </div>
  );
}

export default Navbar;
