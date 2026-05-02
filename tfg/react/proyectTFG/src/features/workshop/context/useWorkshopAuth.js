import { useAuth } from "../../auth/AuthContext";

/** Compatibilidad con vistas del taller: misma sesión que AuthProvider */
function useWorkshopAuth() {
  const { user, isLoading, error, logout, authFetch } = useAuth();
  return {
    user,
    role: user?.role ?? null,
    isLoading,
    error,
    logout,
    authFetch,
  };
}

export default useWorkshopAuth;
