import { API_BASE_URL } from "./apiConfig";
import { obtenerToken } from "./authService";

async function leerRespuestaJson(respuesta) {
  try {
    return await respuesta.json();
  } catch {
    return {};
  }
}

export async function crearRenovacionFlow(datosRenovacion) {
  const token = obtenerToken();

  const respuesta = await fetch(`${API_BASE_URL}/pagos-flow/renovar`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(datosRenovacion),
  });

  const data = await leerRespuestaJson(respuesta);

  if (!respuesta.ok) {
    throw new Error(data.error || "No se pudo iniciar la renovacion.");
  }

  return data;
}
