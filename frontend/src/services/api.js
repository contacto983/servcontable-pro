import { API_BASE_URL } from "./apiConfig";

const API_URL = API_BASE_URL;

export async function obtenerEstadoSistema() {
  const respuesta = await fetch(`${API_URL}/estado`);

  if (!respuesta.ok) {
    throw new Error("No se pudo conectar con el backend");
  }

  return await respuesta.json();
}