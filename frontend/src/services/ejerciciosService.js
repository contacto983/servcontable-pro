import { obtenerToken } from "./authService";

import { API_BASE_URL } from "./apiConfig";

const API_URL = API_BASE_URL;

export async function listarEjercicios(empresa_id) {
  const token = obtenerToken();

  const respuesta = await fetch(`${API_URL}/ejercicios?empresa_id=${empresa_id}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await respuesta.json();

  if (!respuesta.ok) {
    throw new Error(data.error || "Error al listar aÃ±os de trabajo");
  }

  return data;
}

export async function crearEjercicio(datos) {
  const token = obtenerToken();

  const respuesta = await fetch(`${API_URL}/ejercicios`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(datos),
  });

  const data = await respuesta.json();

  if (!respuesta.ok) {
    throw new Error(data.error || "Error al crear aÃ±o de trabajo");
  }

  return data;
}

export async function cerrarEjercicio(id, datos) {
  const token = obtenerToken();

  const respuesta = await fetch(`${API_URL}/ejercicios/${id}/cerrar`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(datos),
  });

  const data = await respuesta.json();

  if (!respuesta.ok) {
    throw new Error(data.error || "Error al cerrar aÃ±o de trabajo");
  }

  return data;
}

export async function reabrirEjercicio(id, datos) {
  const token = obtenerToken();

  const respuesta = await fetch(`${API_URL}/ejercicios/${id}/reabrir`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(datos),
  });

  const data = await respuesta.json();

  if (!respuesta.ok) {
    throw new Error(data.error || "Error al reabrir aÃ±o de trabajo");
  }

  return data;
}

export function guardarEjercicioActivo(ejercicio) {
  sessionStorage.setItem("ejercicioActivo", JSON.stringify(ejercicio));
  localStorage.removeItem("ejercicioActivo");
}

export function obtenerEjercicioActivo() {
  localStorage.removeItem("ejercicioActivo");
  const raw = sessionStorage.getItem("ejercicioActivo");

  if (!raw) return null;

  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function limpiarEjercicioActivo() {
  sessionStorage.removeItem("ejercicioActivo");
  localStorage.removeItem("ejercicioActivo");
}
