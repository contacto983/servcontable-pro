import { obtenerToken } from "./authService";

import { API_BASE_URL } from "./apiConfig";

const API_URL = API_BASE_URL;

export async function listarCuentas(empresaId, incluirInactivas = false) {
  const token = obtenerToken();

  const params = new URLSearchParams();
  params.append("empresa_id", empresaId);
  if (incluirInactivas) {
    params.append("incluir_inactivas", "true");
  }

  const respuesta = await fetch(`${API_URL}/cuentas?${params.toString()}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await respuesta.json();

  if (!respuesta.ok) {
    throw new Error(data.error || "Error al listar cuentas");
  }

  return data;
}

export async function crearCuenta(datosCuenta) {
  const token = obtenerToken();

  const respuesta = await fetch(`${API_URL}/cuentas`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(datosCuenta),
  });

  const data = await respuesta.json();

  if (!respuesta.ok) {
    throw new Error(data.error || "Error al crear cuenta");
  }

  return data;
}

export async function cargarPlanBase(empresaId) {
  const token = obtenerToken();

  const respuesta = await fetch(`${API_URL}/cuentas/plan-base`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ empresa_id: empresaId }),
  });

  const data = await respuesta.json();

  if (!respuesta.ok) {
    throw new Error(data.error || "Error al cargar plan base");
  }

  return data;
}

export async function actualizarCuenta(id, datos) {
  const token = obtenerToken();

  const respuesta = await fetch(`${API_URL}/cuentas/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(datos),
  });

  const data = await respuesta.json();

  if (!respuesta.ok) {
    throw new Error(data.error || "Error al actualizar cuenta");
  }

  return data;
}

export async function cambiarEstadoCuenta(id, empresaId, activo) {
  const token = obtenerToken();

  const respuesta = await fetch(`${API_URL}/cuentas/${id}/estado`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      empresa_id: empresaId,
      activo,
    }),
  });

  const data = await respuesta.json();

  if (!respuesta.ok) {
    throw new Error(data.error || "Error al cambiar estado de la cuenta");
  }

  return data;
}
