import { useContext } from "react";
import WorkshopAuthContext from "./workshopAuthReactContext";

function useWorkshopAuth() {
  const context = useContext(WorkshopAuthContext);
  if (!context) {
    throw new Error("useWorkshopAuth debe usarse dentro de WorkshopAuthProvider");
  }
  return context;
}

export default useWorkshopAuth;
