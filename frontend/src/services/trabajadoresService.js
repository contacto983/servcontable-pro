import { obtenerToken } from "./authService";

import { API_BASE_URL } from "./apiConfig";

const API_URL = API_BASE_URL;

export async function listarTrabajadores(empresaId, estado = "") {
  const token = obtenerToken();

  const params = new URLSearchParams();
  params.append("empresa_id", empresaId);

  if (estado) {
    params.append("estado", estado);
  }

  const respuesta = await fetch(`${API_URL}/trabajadores?${params.toString()}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await respuesta.json();

  if (!respuesta.ok) {
    throw new Error(data.error || "Error al listar trabajadores");
  }

  return data;
}

export async function crearTrabajador(datos) {
  const token = obtenerToken();

  const respuesta = await fetch(`${API_URL}/trabajadores`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(datos),
  });

  const data = await respuesta.json();

  if (!respuesta.ok) {
    throw new Error(data.error || "Error al crear trabajador");
  }

  return data;
}

export async function actualizarTrabajador(id, datos) {
  const token = obtenerToken();

  const respuesta = await fetch(`${API_URL}/trabajadores/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(datos),
  });

  const data = await respuesta.json();

  if (!respuesta.ok) {
    throw new Error(data.error || "Error al actualizar trabajador");
  }

  return data;
}

export async function eliminarTrabajador(id, empresaId) {
  const token = obtenerToken();

  const respuesta = await fetch(`${API_URL}/trabajadores/${id}/eliminar`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      empresa_id: empresaId,
    }),
  });

  const data = await respuesta.json();

  if (!respuesta.ok) {
    throw new Error(data.error || "Error al eliminar trabajador");
  }

  return data;
}