import Select from "react-select";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  API_VEHICLE_URL,
  API_SERVICES_URL,
} from "../../../constantes/constantes";

async function fetchServicios() {
  const res = await fetch(API_SERVICES_URL);

  if (!res.ok) {
    throw new Error("Error al obtener servicios");
  }

  return res.json();
}

function AddModal({ onClose, userId, vehicleId, type }) {
  const queryClient = useQueryClient();

  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  const initialFormData =
    type === "factura"
      ? {
          descripcion: null,
          precio: "",
          date: new Date().toISOString().split("T")[0],
          imagen: null,
        }
      : {
          litros: "",
          monto: "",
          date: new Date().toISOString().split("T")[0],
        };

  const [formData, setFormData] = useState(initialFormData);

  // 🔥 FETCH SERVICIOS SOLO PARA FACTURA
  const {
    data: servicios = [],
    isPending: isServiciosPending,
    isError: isServiciosError,
    error: serviciosError,
  } = useQuery({
    queryKey: ["servicios"],
    queryFn: fetchServicios,
    enabled: type === "factura",
  });

  const serviciosOptions = servicios.map((servicio) => ({
    value: servicio.id,
    label: servicio.name,
  }));

  const handleBlur = (name) => {
    setTouched((prev) => ({ ...prev, [name]: true }));
  };

  const validacion = (name, value) => {
    if (type === "factura") {
      switch (name) {
        case "descripcion":
          if (!value) return "Selecciona un servicio";
          return "";

        case "precio":
          if (!value) return "El precio es obligatorio";
          if (Number(value) <= 0) return "Debe ser mayor que 0";
          return "";

        case "date":
          return "";

        case "imagen":
          if (!value) return "";
          if (value.size > 2 * 1024 * 1024) return "Máx 2MB";
          return "";

        default:
          return "";
      }
    }

    if (type === "gasoil") {
      switch (name) {
        case "litros":
          if (value && Number(value) < 0) return "Debe ser mayor que 0";
          return "";

        case "monto":
          if (!value) return "El importe total es obligatorio";
          if (Number(value) <= 0) return "Debe ser mayor que 0";
          return "";

        case "date":
          return "";

        default:
          return "";
      }
    }

    return "";
  };

  const handleChange = (name, value) => {
    const error = validacion(name, value);

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    setErrors((prev) => ({
      ...prev,
      [name]: error,
    }));
  };

  const validateForm = () => {
    const newErrors = {};

    Object.keys(formData).forEach((key) => {
      const error = validacion(key, formData[key]);
      if (error) newErrors[key] = error;
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const buildPayload = () => {
    if (type === "factura") {
      return {
        userId,
        vehicleId,
        serviceId: formData.descripcion?.value,
        name: formData.descripcion?.label,
        total: Number(formData.precio),
        date: formData.date || new Date().toISOString().split("T")[0],
      };
    }

    return {
      userId,
      vehicleId,
      litros: formData.litros ? Number(formData.litros) : null,
      monto: Number(formData.monto),
      date: formData.date || new Date().toISOString().split("T")[0],
    };
  };

  const createData = async (data) => {
    const endpoint =
      type === "factura"
        ? `${API_VEHICLE_URL}/${userId}/${vehicleId}/facturas`
        : `${API_VEHICLE_URL}/${userId}/${vehicleId}/gasoil`;

    const res = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    let responseData;
    try {
      responseData = await res.json();
    } catch {
      responseData = { message: "Error inesperado del servidor" };
    }

    if (!res.ok) {
      throw responseData;
    }

    return responseData;
  };

  const mutation = useMutation({
    mutationFn: createData,
    onSuccess: async () => {
      await queryClient.refetchQueries({
        queryKey: ["vehicle", userId, vehicleId],
      });
      await queryClient.refetchQueries({
        queryKey: ["vehicles"],
      });
      onClose();
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();

    const allTouched = Object.keys(formData).reduce((acc, key) => {
      acc[key] = true;
      return acc;
    }, {});
    setTouched(allTouched);

    const isValid = validateForm();
    if (!isValid) return;

    const data = buildPayload();
    mutation.mutate(data);
  };

  return (
    <div className="modal-overlay">
      <div className="modal-new-vehicle">
        <button className="close-btn" onClick={onClose}>
          ✖
        </button>

        <h2>NUEVA {type.toUpperCase()}</h2>

        {type === "factura" ? (
          <p>Registra un nuevo gasto de mantenimiento o reparación</p>
        ) : (
          <p>Registra un nuevo repostaje de combustible</p>
        )}

        {/* 🔥 INFO CARGA SERVICIOS */}
        {type === "factura" && (isServiciosPending || isServiciosError) && (
          <div className={`info-label ${isServiciosError ? "error" : ""}`}>
            {isServiciosPending && <p>Cargando servicios...</p>}
            {isServiciosError && (
              <p className="error">Error: {serviciosError?.message}</p>
            )}
          </div>
        )}

        <form className="form" onSubmit={handleSubmit}>
          {/* ================= FACTURA ================= */}
          {type === "factura" && (
            <>
              <div className="datos">
                <label>
                  Servicio:
                  <Select
                    name="descripcion"
                    onBlur={() => handleBlur("descripcion")}
                    isSearchable
                    isClearable
                    maxMenuHeight={150}
                    placeholder="Selecciona un servicio"
                    options={serviciosOptions}
                    value={formData.descripcion}
                    onChange={(option) => handleChange("descripcion", option)}
                    classNamePrefix="select"
                    className={
                      touched.descripcion && errors.descripcion
                        ? "select-error"
                        : ""
                    }
                  />
                  {touched.descripcion && errors.descripcion && (
                    <span className="error-text">{errors.descripcion}</span>
                  )}
                </label>

                <label>
                  Precio:
                  <input
                    type="number"
                    name="precio"
                    onBlur={() => handleBlur("precio")}
                    value={formData.precio}
                    min={0}
                    onChange={(e) => handleChange("precio", e.target.value)}
                    className={
                      touched.precio && errors.precio ? "input error" : "input"
                    }
                  />
                  {touched.precio && errors.precio && (
                    <span className="error-text">{errors.precio}</span>
                  )}
                </label>

                <label>
                  Fecha:
                  <input
                    type="date"
                    value={formData.date}
                    onBlur={() => handleBlur("date")}
                    onChange={(e) => handleChange("date", e.target.value)}
                  />
                  {touched.date && errors.date && (
                    <span className="error-text">{errors.date}</span>
                  )}
                </label>
              </div>

              <label>
                Imagen Factura:
                <input
                  name="imagen"
                  type="file"
                  onBlur={() => handleBlur("imagen")}
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files[0];
                    handleChange("imagen", file);
                  }}
                  className={
                    touched.imagen && errors.imagen ? "input error" : "input"
                  }
                />
                {touched.imagen && errors.imagen && (
                  <span className="error-text">{errors.imagen}</span>
                )}
              </label>
            </>
          )}

          {/* ================= GASOIL ================= */}
          {type === "gasoil" && (
            <div className="datos">
              <label>
                Litros:
                <input
                  type="number"
                  value={formData.litros}
                  onBlur={() => handleBlur("litros")}
                  onChange={(e) => handleChange("litros", e.target.value)}
                  className={
                    touched.litros && errors.litros ? "input error" : "input"
                  }
                />
                {touched.litros && errors.litros && (
                  <span className="error-text">{errors.litros}</span>
                )}
              </label>

              <label>
                Total:
                <input
                  type="number"
                  value={formData.monto}
                  onBlur={() => handleBlur("monto")}
                  onChange={(e) => handleChange("monto", e.target.value)}
                  className={
                    touched.monto && errors.monto ? "input error" : "input"
                  }
                />
                {touched.monto && errors.monto && (
                  <span className="error-text">{errors.monto}</span>
                )}
              </label>

              <label>
                Fecha:
                <input
                  type="date"
                  value={formData.date}
                  onBlur={() => handleBlur("date")}
                  onChange={(e) => handleChange("date", e.target.value)}
                />
                {touched.date && errors.date && (
                  <span className="error-text">{errors.date}</span>
                )}
              </label>
            </div>
          )}

          <button type="submit" disabled={mutation.isPending}>
            {mutation.isPending ? "Guardando..." : "Guardar"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default AddModal;
