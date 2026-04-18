import { auth } from "../firebase/firebaseConfig";

const API_URL = "http://localhost:3000/api";

export const apiRequest = async (endpoint, options = {}) => {
  const user = auth.currentUser;

  if (!user) throw new Error("Usuario no autenticado");

  const token = await user.getIdToken();

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...options.headers
    }
  });

  return response.json();
};