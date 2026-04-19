import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Navbar from "../components/navBar";
import WorkshopCard from "../components/WorkshopCard";
import {
  API_SERVICES_URL,
  API_WORKSHOPS_URL,
} from "../../../constantes/constantes";

const SEARCH_DEBOUNCE_MS = 3000;

async function fetchServices() {
  const response = await fetch(API_SERVICES_URL);
  if (!response.ok) {
    throw new Error("No se pudieron cargar los servicios");
  }
  return response.json();
}

async function fetchWorkshops({ queryKey }) {
  const [, search, service] = queryKey;
  const params = new URLSearchParams();
  if (search) params.set("q", search);
  if (service) params.set("service", service);
  const queryString = params.toString();
  const url = queryString
    ? `${API_WORKSHOPS_URL}?${queryString}`
    : API_WORKSHOPS_URL;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error("No se pudieron cargar los talleres");
  }
  return response.json();
}

function WorkshopsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [selectedService, setSelectedService] = useState("");

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
    queryFn: fetchServices,
  });

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
    queryFn: fetchWorkshops,
    enabled: hasActiveSearch && isTextSearchSettled,
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
            searchTerm.trim().length > 0 && (
              <p>
                Cargando talleres...
              </p>
            )}

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
                  <WorkshopCard key={workshop.id} workshop={workshop} />
                ))}
              </div>
            )}
        </div>
      </div>
    </>
  );
}

export default WorkshopsPage;
