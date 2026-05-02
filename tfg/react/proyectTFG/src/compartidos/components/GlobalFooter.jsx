const CURRENT_YEAR = new Date().getFullYear();

function GlobalFooter() {
  return (
    <footer className="global-footer">
      <div className="global-footer__inner">
        <h3 className="global-footer__brand">AutoLink</h3>
        <p className="global-footer__copyright">
          © {CURRENT_YEAR} Pablo Burgaleta y Ketlin Marriaga.
          Creadores del proyecto AUTOLINK.
        </p>
        <p className="global-footer__institute">IES ITACA ALCORCON</p>
        <p className="global-footer__tech">
          React 19.2.0 · Node.js 22.22.0
        </p>
      </div>
    </footer>
  );
}

export default GlobalFooter;
