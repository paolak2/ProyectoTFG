import { useState } from "react";
import { register } from "../services/authService";
import { apiRequest } from "../services/api";

export default function Register() {

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nombre, setNombre] = useState("");

  const handleRegister = async (e) => {
    e.preventDefault();

    try {
      const user = await register(email, password);

      await apiRequest("/usuarios", {
        method: "POST",
        body: JSON.stringify({
          nombre,
          rol: "cliente"
        })
      });

      alert("Usuario creado");

    } catch (err) {
      console.error(err);
      alert("Error en registro");
    }
  };

  return (
    <form onSubmit={handleRegister}>

      <h2>Registro</h2>

      <input
        placeholder="Nombre"
        onChange={(e) => setNombre(e.target.value)}
      />

      <input
        type="email"
        placeholder="Email"
        onChange={(e) => setEmail(e.target.value)}
      />

      <input
        type="password"
        placeholder="Password"
        onChange={(e) => setPassword(e.target.value)}
      />

      <button type="submit">Registrarse</button>

    </form>
  );
}