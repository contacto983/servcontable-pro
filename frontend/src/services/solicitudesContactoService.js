import { API_BASE_URL } from "./apiConfig";

function obtenerToken() {
  try {
    const usuarioSession = sessionStorage.getItem("usuario");

    if (usuarioSession) {
      const usuario = JSON.parse(usuarioSession);

      if (usuario?.token) {
        return usuario.token;
      }
    }
  } catch {
    // Ignorar error de lectura
  }

  try {
    const usuarioLocal = localStorage.getItem("usuario");

    if (usuarioLocal) {
      const usuario = JSON.parse(usuarioLocal);

      if (usuario?.token) {
        return usuario.token;
      }
    }
  } catch {
    // Ignorar error de lectura
  }

  return "";
}

function headersJson() {
  const token = obtenerToken();

  console.log("TOKEN SOLICITUDES WEB:", token ? "ENCONTRADO" : "NO ENCONTRADO");

  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
}

export async function listarSolicitudesContacto() {
  const respuesta = await fetch(`${API_BASE_URL}/contacto`, {
    method: "GET",
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