import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import Navbar from "../components/navBar";
import WorkshopCard from "../components/WorkshopCard";
import CitaSolicitudModal from "../components/CitaSolicitudModal";
import {
  API_SERVICES_URL,
  API_VEHICLES_URL,
  API_WORKSHOPS_URL,
} from "../../../constantes/constantes";
import { useAuth } from "../../auth/AuthContext";

const SEARCH_DEBOUNCE_MS = 3000;

function WorkshopsPage() {
  const queryClient = useQueryClient();
  const { user, authFetch } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [selectedService, setSelectedService] = useState("");
  const [citaWorkshop, setCitaWorkshop] = useState(null);

  useEffect(() => {
    if (searchTerm.trim() === "") {
      setDebouncedSearchTerm("");
      return;
    }
    const timeoutId = window.setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, SEARCH_DEBOUNCE_MS);
    return () => window.clearTimeout(timeoutId);
  }, [searchTerm]);

  const {
    data: services = [],
    isPending: isPendingServices,
    isError: isErrorServices,
    error: servicesError,
  } = useQuery({
    queryKey: ["services"],
    queryFn: async () => {
      const response = await authFetch(API_SERVICES_URL);
      if (!response.ok) {
        throw new Error("No se pudieron cargar los servicios");
      }
      return response.json();
    },
    enabled: Boolean(user?.id),
  });

  const { data: vehiclesUsuario = [] } = useQuery({
    queryKey: ["vehicles", user?.id],
    queryFn: async () => {
      const res = await authFetch(API_VEHICLES_URL);
      if (!res.ok) {
        throw new Error("Error al obtener vehículos");
      }
      return res.json();
    },
    enabled: Boolean(user?.id),
  });

  const vehiclesDisponiblesCita = useMemo(
    () =>
      vehiclesUsuario.filter(
        (v) => v.status === "Disponible" && !v.solicitudCita,
      ),
    [vehiclesUsuario],
  );

  const hasActiveSearch =
    searchTerm.trim().length > 0 || selectedService.length > 0;

  const isTextSearchSettled =
    searchTerm.trim() === debouncedSearchTerm.trim();

  const {
    data: workshops = [],
    isPending: isPendingWorkshops,
    isError: isErrorWorkshops,
    error: workshopsError,
  } = useQuery({
    queryKey: [
      "workshops",
      debouncedSearchTerm.trim(),
      selectedService,
    ],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (debouncedSearchTerm.trim()) {
        params.set("q", debouncedSearchTerm.trim());
      }
      if (selectedService) {
        params.set("service", selectedService);
      }
      const queryString = params.toString();
      const url = queryString
        ? `${API_WORKSHOPS_URL}?${queryString}`
        : API_WORKSHOPS_URL;
      const response = await authFetch(url);
      if (!response.ok) {
        throw new Error("No se pudieron cargar los talleres");
      }
      return response.json();
    },
    enabled: Boolean(user?.id) && hasActiveSearch && isTextSearchSettled,
    placeholderData: (previousData) => previousData,
  });

  const hasFiltersToClear =
    searchTerm.trim().length > 0 || selectedService.length > 0;

  function clearFilters() {
    setSearchTerm("");
    setDebouncedSearchTerm("");
    setSelectedService("");
  }

  return (
    <>
      <Navbar />
      <div className="bodyWorkshops">
        <div className="workshops">
          <div className="workshops__header">
            <div>
              <h1>Buscar Talleres</h1>
              <p>Encuentra el taller perfecto para tu vehiculo</p>
            </div>
          </div>

          <div className="workshops__search">
            <input
              id="workshops-search"
              name="workshopsSearch"
              type="search"
              autoComplete="off"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Busca por nombre, direccion, telefono, email o web"
            />
            <button
              type="button"
              className="workshops__search-clear"
              onClick={clearFilters}
              disabled={!hasFiltersToClear}
              aria-label="Borrar texto de busqueda y filtros de servicio"
              title="Limpiar busqueda y filtros"
            >
              <i className="bi bi-x-lg" aria-hidden="true" />
            </button>
          </div>

          <div className="workshops__filters">
            {isPendingServices && <p>Cargando filtros...</p>}
            {isErrorServices && <p>{servicesError.message}</p>}
            {!isPendingServices &&
              !isErrorServices &&
              services.map((service) => {
                const isSelected = selectedService === service.name;
                return (
                  <button
                    type="button"
                    key={service.id}
                    className={isSelected ? "selected" : ""}
                    onClick={() =>
                      setSelectedService(isSelected ? "" : service.name)
                    }
                  >
                    {service.name}
                  </button>
                );
              })}
          </div>

          {hasActiveSearch &&
            !isTextSearchSettled &&
            searchTerm.trim().length > 0 && <p>Cargando talleres...</p>}

          {hasActiveSearch &&
            isTextSearchSettled &&
            isPendingWorkshops && <p>Cargando talleres...</p>}
          {hasActiveSearch && isTextSearchSettled && isErrorWorkshops && (
            <p>{workshopsError.message}</p>
          )}

          {!hasActiveSearch && <p>Comienza tu busqueda</p>}

          {hasActiveSearch &&
            isTextSearchSettled &&
            !isPendingWorkshops &&
            !isErrorWorkshops && (
              <div className="workshops__cards">
                {workshops.length === 0 && (
                  <p>No se encontraron talleres para tu busqueda.</p>
                )}

                {workshops.map((workshop) => (
                  <WorkshopCard
                    key={workshop.id}
                    workshop={workshop}
                    onContactar={setCitaWorkshop}
                  />
                ))}
              </div>
            )}
        </div>
      </div>
      {citaWorkshop && (
        <CitaSolicitudModal
          mode="workshop"
          fixedWorkshop={citaWorkshop}
          vehiclesDisponibles={vehiclesDisponiblesCita}
          onClose={() => setCitaWorkshop(null)}
          onSuccess={() => {
            queryClient.invalidateQueries({
              queryKey: ["vehicles", user.id],
            });
          }}
        />
      )}
    </>
  );
}

export default WorkshopsPage;
