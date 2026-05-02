import { useEffect, useMemo, useState } from "react";
import { API_TALLER_SESSION_URL } from "../../../constantes/constantes";
import WorkshopAuthContext from "./workshopAuthContext";

const VALID_ROLES = ["admin", "empleado"];

function getRoleFromUrl() {
  const urlRole = new URLSearchParams(window.location.search).get("role");
  return VALID_ROLES.includes(urlRole) ? urlRole : null;
}

export function WorkshopAuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function loadSession() {
      try {
        setIsLoading(true);
        setError(null);

        const roleFromUrl = getRoleFromUrl();
        const storedRole = localStorage.getItem("tallerRole");
        const role =
          roleFromUrl ??
          (VALID_ROLES.includes(storedRole) ? storedRole : "admin");

        const response = await fetch(`${API_TALLER_SESSION_URL}?role=${role}`);
        if (!response.ok) {
          throw new Error("No se pudo cargar la sesion del taller");
        }

        const data = await response.json();
        localStorage.setItem("tallerRole", data.role);
        setUser(data);
      } catch (sessionError) {
        setError(sessionError.message);
      } finally {
        setIsLoading(false);
      }
    }

    loadSession();
  }, []);

  const value = useMemo(
    () => ({
      user,
      role: user?.role ?? null,
      isLoading,
      error,
    }),
    [user, isLoading, error],
  );

  return (
    <WorkshopAuthContext.Provider value={value}>
      {children}
    </WorkshopAuthContext.Provider>
  );
}
