import "./App.css";
import { Routes, Route, Navigate } from "react-router-dom";
import GaragePage from "./features/garage/pages/GaragePage";
import VehicleDetailPage from "./features/garage/pages/VehicleDetailPage";
import WorkshopsPage from "./features/garage/pages/WorkshopsPage";
import { WorkshopAuthProvider } from "./features/workshop/context/WorkshopAuthContext";
import RequireWorkshopRole from "./features/workshop/components/RequireWorkshopRole";
import TallerLayout from "./features/workshop/pages/TallerLayout";
import TallerPanelPage from "./features/workshop/pages/TallerPanelPage";
import TallerChatPage from "./features/workshop/pages/TallerChatPage";
import TallerFacturacionPage from "./features/workshop/pages/TallerFacturacionPage";
import TallerVerFacturasPage from "./features/workshop/pages/TallerVerFacturasPage";

function App() {
  return (
    <Routes>
      <Route path="/garage" element={<GaragePage />} />
      <Route path="/talleres" element={<WorkshopsPage />} />
      {/*<Route path="/vehicle/:id" element={<VehicleDetailPage />} />*/}
      <Route path="/vehicle/:userId/:id" element={<VehicleDetailPage />} />
      <Route
        path="/taller"
        element={
          <WorkshopAuthProvider>
            <TallerLayout />
          </WorkshopAuthProvider>
        }
      >
        <Route index element={<Navigate to="/taller/panel" replace />} />
        <Route path="panel" element={<TallerPanelPage />} />
        <Route path="chat" element={<TallerChatPage />} />
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
  );
}

export default App;
