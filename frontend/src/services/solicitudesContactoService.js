import { API_BASE_URL } from "./apiConfig";

function obtenerToken() {
  return (
    localStorage.getItem("token") ||
    localStorage.getItem("authToken") ||
    localStorage.getItem("servcontable_token") ||
    ""
  );
}

function headersJson() {
  const token = obtenerToken();

  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export async function listarSolicitudesContacto() {
  const respuesta = await fetch(`${API_BASE_URL}/contacto`, {
    headers: headersJson(),
  });

  const data = await respuesta.json();

  if (!respuesta.ok) {
    throw new Error(data.error || "No se pudieron cargar las solicitudes.");
  }

  return data.solicitudes || [];
}

export async function actualizarSolicitudContacto(id, payload = {}) {
  const respuesta = await fetch(`${API_BASE_URL}/contacto/${id}`, {
    method: "PATCH",
    headers: headersJson(),
    body: JSON.stringify(payload),
  });

  const data = await respuesta.json();

  if (!respuesta.ok) {
    throw new Error(data.error || "No se pudo actualizar la solicitud.");
  }

  return data.solicitud;
}