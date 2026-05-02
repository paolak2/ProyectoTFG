import "./App.css";
import { Routes, Route, Navigate } from "react-router-dom";
import GaragePage from "./features/garage/pages/GaragePage";
import VehicleDetailPage from "./features/garage/pages/VehicleDetailPage";
import WorkshopsPage from "./features/garage/pages/WorkshopsPage";
import RequireWorkshopRole from "./features/workshop/components/RequireWorkshopRole";
import TallerLayout from "./features/workshop/pages/TallerLayout";
import TallerPanelPage from "./features/workshop/pages/TallerPanelPage";
import TallerChatPage from "./features/workshop/pages/TallerChatPage";
import TallerFacturacionPage from "./features/workshop/pages/TallerFacturacionPage";
import TallerVerFacturasPage from "./features/workshop/pages/TallerVerFacturasPage";
import TallerCitasPage from "./features/workshop/pages/TallerCitasPage";
import LoginPage from "./features/auth/LoginPage";
import RequireCliente from "./features/auth/RequireCliente";
import RequireTaller from "./features/auth/RequireTaller";
import GlobalFooter from "./compartidos/components/GlobalFooter";

function App() {
  return (
    <div className="app-shell">
      <main className="app-content">
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/" element={<Navigate to="/login" replace />} />

          <Route
            path="/garage"
            element={
              <RequireCliente>
                <GaragePage />
              </RequireCliente>
            }
          />
          <Route
            path="/talleres"
            element={
              <RequireCliente>
                <WorkshopsPage />
              </RequireCliente>
            }
          />
          <Route
            path="/vehicle/:userId/:id"
            element={
              <RequireCliente>
                <VehicleDetailPage />
              </RequireCliente>
            }
          />

          <Route
            path="/taller"
            element={
              <RequireTaller>
                <TallerLayout />
              </RequireTaller>
            }
          >
            <Route index element={<Navigate to="/taller/panel" replace />} />
            <Route path="panel" element={<TallerPanelPage />} />
            <Route
              path="citas"
              element={
                <RequireWorkshopRole allowedRole="admin">
                  <TallerCitasPage />
                </RequireWorkshopRole>
              }
            />
            <Route
              path="chat"
              element={<Navigate to="/taller/panel" replace />}
            />
            <Route
              path="facturacion"
              element={
                <RequireWorkshopRole allowedRole="admin">
                  <TallerFacturacionPage />
                </RequireWorkshopRole>
              }
            />
            <Route
              path="ver-facturas"
              element={
                <RequireWorkshopRole allowedRole="empleado">
                  <TallerVerFacturasPage />
                </RequireWorkshopRole>
              }
            />
          </Route>
        </Routes>
      </main>
      <GlobalFooter />
    </div>
  );
}

export default App;
