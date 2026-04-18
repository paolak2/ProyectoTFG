import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Navbar from "../components/navBar";
import {
  API_SERVICES_URL,
  API_WORKSHOPS_URL,
} from "../../../constantes/constantes";

const SEARCH_DEBOUNCE_MS = 3000;

function WorkshopRatingStars({ rating, maxStars = 5 }) {
  const value = Number(rating);
  const safe = Number.isFinite(value)
    ? Math.min(maxStars, Math.max(0, value))
    : 0;
  const label = `${safe.toLocaleString("es-ES", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  })} / ${maxStars}`;

  const stars = [];
  for (let i = 1; i <= maxStars; i++) {
    if (safe >= i) {
      stars.push(
        <i key={i} className="bi bi-star-fill" aria-hidden="true" />,
      );
    } else if (safe >= i - 0.5) {
      stars.push(
        <i key={i} className="bi bi-star-half" aria-hidden="true" />,
      );
    } else {
      stars.push(<i key={i} className="bi bi-star" aria-hidden="true" />);
    }
  }

  return (
    <div className="workshopCard__rating" role="img" aria-label={label}>
      <span className="workshopCard__rating-stars">{stars}</span>
      <span className="workshopCard__rating-value">
        {safe.toLocaleString("es-ES", {
          minimumFractionDigits: 1,
          maximumFractionDigits: 1,
        })}
        <span className="workshopCard__rating-max">/{maxStars}</span>
      </span>
    </div>
  );
}

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
                La busqueda se enviara al servidor cuando lleves{" "}
                {SEARCH_DEBOUNCE_MS / 1000} segundos sin escribir.
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
                <article className="workshopCard" key={workshop.id}>
                  <header>
                    <div className="workshop-image">
                      {workshop.ruta ? (
                        <img src={workshop.ruta} alt={workshop.name} />
                      ) : (
                        <i className="bi bi bi-tools"></i>
                      )}
                    </div>
                    <div className="workshop-info">
                      <h4>{workshop.name}</h4>
                      <p>{workshop.address}</p>
                      <p>{workshop.phone}</p>
                    </div>
                  </header>
                  <div className="workshop-status">
                    <WorkshopRatingStars rating={workshop.rating} />
                    <span className="workshop-status-text">
                      {workshop.status}
                    </span>
                  </div>
                  <div className="workshop-details">
                    <p>
                      <strong>Email:</strong> {workshop.email}
                    </p>
                    <p>
                      <strong>Horario:</strong> {workshop.schedule}
                    </p>
                    <p>
                      <strong>Web:</strong>{" "}
                      <a href={workshop.website} target="_blank" rel="noreferrer">
                        {workshop.website}
                      </a>
                    </p>
                  </div>
                  <div className="workshopCard__services">
                    {workshop.services?.map((service) => (
                      <span key={`${workshop.id}-${service}`}>{service}</span>
                    ))}
                  </div>
                  <div className="workshop-footer">
                    <button>Contactar Taller</button>
                  </div>
                </article>
              ))}
            </div>
            )}
        </div>
      </div>
    </>
  );
}

export default WorkshopsPage;
