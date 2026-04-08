export const brands = [
  { id: 1, name: "Audi" },
  { id: 2, name: "BMW" },
  { id: 3, name: "Mercedes-Benz" },
  { id: 4, name: "Volkswagen" },
  { id: 5, name: "Toyota" },
  { id: 6, name: "Honda" },
  { id: 7, name: "Ford" },
  { id: 8, name: "Renault" },
  { id: 9, name: "Peugeot" },
  { id: 10, name: "Citroën" },
  { id: 11, name: "Seat" },
  { id: 12, name: "Skoda" },
  { id: 13, name: "Hyundai" },
  { id: 14, name: "Kia" },
  { id: 15, name: "Nissan" },
  { id: 16, name: "Mazda" },
  { id: 17, name: "Volvo" },
  { id: 18, name: "Tesla" },
  { id: 19, name: "Dacia" },
  { id: 20, name: "Jeep" },
];

export const models = [
  { id: 1, brandId: 1, name: "A3" },
  { id: 2, brandId: 1, name: "A4" },
  { id: 3, brandId: 2, name: "Serie 1" },
  { id: 4, brandId: 2, name: "Serie 3" },
  { id: 5, brandId: 3, name: "Clase A" },
  { id: 6, brandId: 3, name: "Clase C" },
  { id: 7, brandId: 4, name: "Golf" },
  { id: 8, brandId: 4, name: "Passat" },
  { id: 9, brandId: 5, name: "Corolla" },
  { id: 10, brandId: 5, name: "Yaris" },
  { id: 11, brandId: 7, name: "Focus" },
  { id: 12, brandId: 7, name: "Fiesta" },
  { id: 13, brandId: 8, name: "Clio" },
  { id: 14, brandId: 8, name: "Megane" },
  { id: 15, brandId: 11, name: "Ibiza" },
  { id: 16, brandId: 11, name: "Leon" },
];

export const insurances = [
  { id: 1, name: "Mapfre" },
  { id: 2, name: "Allianz" },
  { id: 3, name: "AXA" },
  { id: 4, name: "Mutua Madrileña" },
  { id: 5, name: "Generali" },
  { id: 6, name: "Zurich" },
  { id: 7, name: "Línea Directa" },
  { id: 8, name: "Reale Seguros" },
  { id: 9, name: "Ocaso" },
  { id: 10, name: "Helvetia" },
];

export const vehicles = [
  {
    id: 1,
    userId: 1,
    brandId: 2, // BMW
    modelId: 4, // Serie 3
    insuranceId: 1,
    insuranceNumber: "MAP123456789",
    plate: "1234ABC",
    year: 2020,
    color: "Negro",
    status: "En Taller",
    mileage: 50000,
    ruta: null,
    taller: {
      name: "Taller AutoExpert",
      entryDate: "2024-03-15",
      estimatedFinish: "2024-03-25",
      servicio: "Cambio de aceite y revisión general",
    },
  },
  {
    id: 2,
    userId: 1,
    brandId: 2, //BMW
    modelId: 3, // Serie 1
    insuranceId: 2,
    insuranceNumber: "ALL123456789",
    plate: "2234ABC",
    year: 2022,
    color: "Blanco",
    status: "Disponible",
    mileage: 20000,
    ruta: null,
    taller: null,
  },
];
