import Select from "react-select";
import {
  API_BRANDS_URL,
  API_MODELS_URL,
  API_INSURANCES_URL,
  API_VEHICLES_URL,
  API_VEHICLE_URL,
} from "../../../constantes/constantes";
import { colores } from "../../../constantes/colores";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

async function fetchMarcas() {
  const res = await fetch(API_BRANDS_URL);
  if (!res.ok) {
    throw new Error("Error al obtener marcas");
  }
  return res.json();
}

async function fetchAseguradoras() {
  const res = await fetch(API_INSURANCES_URL);
  if (!res.ok) {
    throw new Error("Error al obtener aseguradoras");
  }
  return res.json();
}

function ModalForm({ onClose, userId, vehicleToEdit = null }) {
  const queryClient = useQueryClient();
  const currentYear = new Date().getFullYear();
  const isEditMode = Boolean(vehicleToEdit);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const handleBlur = (name) => {
    setTouched((prev) => ({ ...prev, [name]: true }));
  };
  const initialFormData = useMemo(
    () => ({
      matricula: vehicleToEdit?.plate || "",
      marca: vehicleToEdit
        ? {
            value: vehicleToEdit.brandId,
            label: vehicleToEdit.brandName,
          }
        : null,
      modelo: vehicleToEdit
        ? {
            value: vehicleToEdit.modelId,
            label: vehicleToEdit.modelName,
          }
        : null,
      color: vehicleToEdit
        ? {
            value: vehicleToEdit.color,
            label: vehicleToEdit.color,
            color: vehicleToEdit.color,
          }
        : null,
      year: vehicleToEdit
        ? {
            value: vehicleToEdit.year,
            label: vehicleToEdit.year,
          }
        : null,
      kms:
        vehicleToEdit?.mileage !== undefined && vehicleToEdit?.mileage !== null
          ? String(vehicleToEdit.mileage)
          : "",
      aseguradora:
        vehicleToEdit?.insuranceId && vehicleToEdit?.insuranceName
          ? {
              value: vehicleToEdit.insuranceId,
              label: vehicleToEdit.insuranceName,
            }
          : null,
      numPoliza: vehicleToEdit?.insuranceNumber || "",
      imagen: null,
    }),
    [vehicleToEdit],
  );
  const [formData, setFormData] = useState(initialFormData);

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

  const {
    data: marcas = [],
    isPending,
    isError,
    error,
  } = useQuery({
    queryKey: ["marcas"],
    queryFn: fetchMarcas,
  });

  const {
    data: modelos = [],
    isPending: isModelosPending,
    isError: isModelosError,
    error: modelosError,
  } = useQuery({
    queryKey: ["modelos", formData.marca?.value],
    queryFn: async () => {
      const res = await fetch(
        `${API_MODELS_URL}?brandId=${formData.marca.value}`,
      );
      if (!res.ok) {
        throw new Error("Error al obtener modelos");
      }
      return res.json();
    },
    enabled: !!formData.marca,
  });

  const {
    data: aseguradoras = [],
    isPending: isAseguradorasPending,
    isError: isAseguradorasError,
    error: aseguradorasError,
  } = useQuery({
    queryKey: ["aseguradoras"],
    queryFn: fetchAseguradoras,
  });

  //OBLIGATORIO PARA REACT-SELECT
  const marcasOptions = marcas.map((marca) => ({
    value: marca.id, // o marca.nombre
    label: marca.name, // lo que quieres mostrar
  }));
  const modelosOptions = modelos.map((modelo) => ({
    value: modelo.id, // o modelo.nombre
    label: modelo.name, // lo que quieres mostrar
  }));
  const aseguradorasOptions = aseguradoras.map((aseguradora) => ({
    value: aseguradora.id, // o aseguradora.nombre
    label: aseguradora.name, // lo que quieres mostrar
  }));

  const customOption = (props) => {
    return (
      <div className="custom-option" {...props.innerProps}>
        <span
          style={{
            backgroundColor: props.data.color,
          }}
        />
        {props.data.label}
      </div>
    );
  };

  const mostrarInfo =
    isPending ||
    (formData.marca && isModelosPending) ||
    isError ||
    isModelosError ||
    isAseguradorasPending ||
    isAseguradorasError ||
    aseguradorasError;

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
  const upsertVehicle = async (data) => {
    const endpoint =
      isEditMode && vehicleToEdit
        ? `${API_VEHICLE_URL}/${userId}/${vehicleToEdit.id}`
        : API_VEHICLES_URL;

    const res = await fetch(endpoint, {
      method: isEditMode ? "PUT" : "POST",
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
    mutationFn: upsertVehicle,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vehicles"] });
      if (isEditMode && vehicleToEdit) {
        queryClient.invalidateQueries({
          queryKey: ["vehicle", String(userId), String(vehicleToEdit.id)],
        });
      }
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
        <h2>{isEditMode ? "Editar Vehículo" : "Añadir Nuevo Vehículo"}</h2>
        {mostrarInfo && (
          <div
            className={`info-label ${isError || isModelosError ? "error" : ""}`}
          >
            {isPending && <p>Cargando...</p>}
            {formData.marca && isModelosPending && <p>Cargando modelos...</p>}
            {(isError || isModelosError) && (
              <p className="error">
                Error: {error?.message || modelosError?.message}
              </p>
            )}
          </div>
        )}
        <form className="form" onSubmit={handleSubmit}>
          <div className="datos">
            <label>
              Marca:
              <Select
                name="marca"
                onBlur={() => handleBlur("marca")}
                isSearchable={true}
                isClearable={true}
                maxMenuHeight={150}
                placeholder="Selecciona una marca"
                options={marcasOptions}
                value={formData.marca}
                onChange={(option) => handleChange("marca", option)}
                classNamePrefix="select"
                className={touched.marca && errors.marca ? "select-error" : ""}
              />
              {touched.marca && errors.marca && (
                <span className="error-text">{errors.marca}</span>
              )}
            </label>
            <label>
              Modelo:
              <Select
                name="modelo"
                onBlur={() => handleBlur("modelo")}
                options={modelosOptions}
                isSearchable={true}
                isClearable={true}
                maxMenuHeight={150}
                placeholder="Selecciona un modelo"
                value={formData.modelo}
                isDisabled={!formData.marca}
                onChange={(option) => handleChange("modelo", option)}
                classNamePrefix="select"
                className={
                  touched.modelo && errors.modelo ? "select-error" : ""
                }
              />
              {touched.modelo && errors.modelo && (
                <span className="error-text">{errors.modelo}</span>
              )}
            </label>
            <label>
              Matrícula:
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
              Año Coche:
              <Select
                name="year"
                onBlur={() => handleBlur("year")}
                options={Array.from(
                  { length: currentYear - 1990 + 1 },
                  (_, i) => ({ value: 1990 + i, label: 1990 + i }),
                )}
                isSearchable={true}
                isClearable={true}
                maxMenuHeight={150}
                value={formData.year}
                min={1990}
                max={currentYear}
                onChange={(option) => handleChange("year", option)}
                classNamePrefix="select"
                className={touched.year && errors.year ? "select-error" : ""}
              />
              {touched.year && errors.year && (
                <span className="error-text">{errors.year}</span>
              )}
            </label>
          </div>
          <div className="datos">
            <label>
              Color:
              <Select
                name="color"
                onBlur={() => handleBlur("color")}
                options={colores}
                components={{ Option: customOption }}
                isSearchable={true}
                isClearable={true}
                maxMenuHeight={150}
                value={formData.color}
                onChange={(option) => handleChange("color", option)}
                classNamePrefix="select"
                className={touched.color && errors.color ? "select-error" : ""}
              />
              {touched.color && errors.color && (
                <span className="error-text">{errors.color}</span>
              )}
            </label>
            <label>
              Kilometraje Actual Coche:
              <input
                type="number"
                name="kms"
                onBlur={() => handleBlur("kms")}
                value={formData.kms}
                min={0}
                onChange={(e) => handleChange("kms", e.target.value)}
                className={touched.kms && errors.kms ? "input error" : "input"}
              />
              {touched.kms && errors.kms && (
                <span className="error-text">{errors.kms}</span>
              )}
            </label>
            <label>
              Aseguradora:
              <Select
                name="aseguradora"
                onBlur={() => handleBlur("aseguradora")}
                options={aseguradorasOptions}
                isSearchable={true}
                isClearable={true}
                maxMenuHeight={120}
                placeholder="Selecciona una aseguradora"
                value={formData.aseguradora}
                onChange={(option) => handleChange("aseguradora", option)}
                classNamePrefix="select"
                className={
                  touched.aseguradora && errors.aseguradora
                    ? "select-error"
                    : ""
                }
              />
              {touched.aseguradora && errors.aseguradora && (
                <span className="error-text">{errors.aseguradora}</span>
              )}
            </label>
            <label>
              Numero de poliza:
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
            Imagen Coche:
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
      </div>
    </div>
  );
}

export default ModalForm;
