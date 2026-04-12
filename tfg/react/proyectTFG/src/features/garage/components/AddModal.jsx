import Select from "react-select";
import {
  API_BRANDS_URL,
  API_MODELS_URL,
  API_INSURANCES_URL,
  API_VEHICLES_URL,
} from "../../../constantes/constantes";
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";

function AddModal({ onClose, userId, type }) {
  const queryClient = useQueryClient();
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const handleBlur = (name) => {
    setTouched((prev) => ({ ...prev, [name]: true }));
  };
  const [formData, setFormData] = useState({
    matricula: "",
    marca: null,
    modelo: null,
    color: null,
    year: null,
    kms: "",
    aseguradora: null,
    numPoliza: "",
    imagen: null,
  });

  const validacion = (name, value) => {
    switch (name) {
      case "matricula":
        if (!value) return "Obligatorio";
        if (!/^[A-Za-z0-9]{1,8}$/.test(value)) return "Formato inválido";
        return "";

      case "marca":
        if (!value) return "Selecciona una marca";
        return "";

      case "modelo":
        if (!value) return "Selecciona un modelo";
        return "";

      case "year":
        if (!value) return "Selecciona un año";
        return "";

      case "color":
        if (!value) return "Selecciona un color";
        return "";

      case "kms":
        if (value && Number(value) < 0) return "No puede ser negativo";
        return "";

      case "imagen":
        if (!value) return "";
        if (value.size > 2 * 1024 * 1024) return "Máx 2MB";
        return "";

      default:
        return "";
    }
  };

  const handleChange = (name, value) => {
    // reset modelo si cambia marca
    if (name === "marca") {
      setFormData((prev) => ({
        ...prev,
        marca: value,
        modelo: null,
      }));

      setErrors((prev) => ({
        ...prev,
        marca: validacion("marca", value),
        modelo: "Selecciona un modelo",
      }));

      return;
    }

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
    console.log("200 - ", newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("205 SUBMIT");

    const allTouched = Object.keys(formData).reduce((acc, key) => {
      acc[key] = true;
      return acc;
    }, {});
    setTouched(allTouched);

    const isValid = validateForm();
    console.log("✅ valid:", isValid);

    if (!isValid) return;

    const data = buildDatos();
    console.log("209 FORM OK:", data);
    mutation.mutate(data);
  };

  const buildDatos = () => {
    return {
      userId: userId,
      plate: formData.matricula,
      brandId: formData.marca?.value,
      modelId: formData.modelo?.value,
      year: formData.year?.value,
      color: formData.color?.value,
      mileage: Number(formData.kms),
      insuranceId: formData.aseguradora?.value,
      insuranceNumber: formData.numPoliza,
    };
  };
  const createVehicle = async (data) => {
    const res = await fetch(API_VEHICLES_URL, {
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
    mutationFn: createVehicle,
    onSuccess: () => {
      queryClient.invalidateQueries(["vehiculos"]); // refresca lista
      onClose(); // cerrar modal
    },
    onError: (error) => {
      console.log("Errores backend:", error);
    },
  });
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
        {type === "factura" && (
          <form className="form" onSubmit={handleSubmit}>
            <div className="datos">
              <label>
                Descripción:
                <input
                  onBlur={() => handleBlur("matricula")}
                  type="text"
                  value={formData.matricula}
                  onChange={(e) =>
                    handleChange("matricula", e.target.value.toUpperCase())
                  }
                  className={
                    touched.matricula && errors.matricula
                      ? "input error"
                      : "input"
                  }
                />
                {touched.matricula && errors.matricula && (
                  <span className="error-text">{errors.matricula}</span>
                )}
              </label>
              <label>
                Precio:
                <input
                  type="number"
                  name="kms"
                  onBlur={() => handleBlur("kms")}
                  value={formData.kms}
                  min={0}
                  onChange={(e) => handleChange("kms", e.target.value)}
                  className={
                    touched.kms && errors.kms ? "input error" : "input"
                  }
                />
                {touched.kms && errors.kms && (
                  <span className="error-text">{errors.kms}</span>
                )}
              </label>

              <label>
                Fecha:
                <input
                  type="text"
                  pattern="[A-Za-z0-9]{0,20}"
                  name="numPoliza"
                  onBlur={() => handleBlur("numPoliza")}
                  value={formData.numPoliza}
                  onChange={(e) => handleChange("numPoliza", e.target.value)}
                  className={
                    touched.numPoliza && errors.numPoliza
                      ? "input error"
                      : "input"
                  }
                />
                {touched.numPoliza && errors.numPoliza && (
                  <span className="error-text">{errors.numPoliza}</span>
                )}
              </label>
            </div>
            <label>
              Imagen Factura:
              <input
                name="imagenCoche"
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
            <button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? "Guardando..." : "Guardar"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

export default AddModal;
