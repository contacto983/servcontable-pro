import { obtenerToken } from "./authService";

import { API_BASE_URL } from "./apiConfig";

const API_URL = API_BASE_URL;

export async function crearEmpresa(datosEmpresa) {
  const token = obtenerToken();

  const respuesta = await fetch(`${API_URL}/empresas`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(datosEmpresa),
  });

  const data = await respuesta.json();

  if (!respuesta.ok) {
    throw new Error(data.error || "Error al crear empresa");
  }

  return data;
}

export async function listarEmpresas() {
  const token = obtenerToken();

  const respuesta = await fetch(`${API_URL}/empresas`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await respuesta.json();

  if (!respuesta.ok) {
    throw new Error(data.error || "Error al listar empresas");
  }

  return data;
}

export async function actualizarEmpresa(id, datosEmpresa) {
  const token = obtenerToken();

  const respuesta = await fetch(`${API_URL}/empresas/${id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(datosEmpresa),
  });

  const data = await respuesta.json();

  if (!respuesta.ok) {
    throw new Error(data.error || "Error al actualizar empresa");
  }

  return data;
}

export async function eliminarEmpresa(id) {
  const token = obtenerToken();

  const respuesta = await fetch(`${API_URL}/empresas/${id}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await respuesta.json();

  if (!respuesta.ok) {
    throw new Error(data.error || "Error al eliminar empresa");
  }

  return data;
}

export function guardarEmpresaActiva(empresa) {
  sessionStorage.setItem("empresaActiva", JSON.stringify(empresa));
  localStorage.removeItem("empresaActiva");
}

export function obtenerEmpresaActiva() {
  localStorage.removeItem("empresaActiva");
  const empresaGuardada = sessionStorage.getItem("empresaActiva");

  if (!empresaGuardada) {
    return null;
  }

  try {
    return JSON.parse(empresaGuardada);
  } catch {
    eliminarEmpresaActiva();
    return null;
  }
}

export function eliminarEmpresaActiva() {
  sessionStorage.removeItem("empresaActiva");
  localStorage.removeItem("empresaActiva");
}



