import "./App.css";
import { Routes, Route } from "react-router-dom";
import GaragePage from "./features/garage/pages/GaragePage";
import VehicleDetailPage from "./features/garage/pages/VehicleDetailPage";

function App() {
  return (
    <Routes>
      <Route path="/" element={<GaragePage />} />
      {/*<Route path="/vehicle/:id" element={<VehicleDetailPage />} />*/}
      <Route path="/vehicle/:userId/:id" element={<VehicleDetailPage />} />
    </Routes>
  );
}

export default App;
