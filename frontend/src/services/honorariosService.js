import { obtenerToken } from "./authService";

import { API_BASE_URL } from "./apiConfig";

const API_URL = API_BASE_URL;

export async function crearHonorario(datos) {
  const token = obtenerToken();

  const respuesta = await fetch(`${API_URL}/honorarios`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(datos),
  });

  const data = await respuesta.json();

  if (!respuesta.ok) {
    throw new Error(data.error || "Error al crear honorario");
  }

  return data;
}

export async function listarHonorarios(empresaId, fechaDesde, fechaHasta) {
  const token = obtenerToken();

  const params = new URLSearchParams();
  params.append("empresa_id", empresaId);
  params.append("fecha_desde", fechaDesde);
  params.append("fecha_hasta", fechaHasta);

  const respuesta = await fetch(`${API_URL}/honorarios?${params.toString()}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await respuesta.json();

  if (!respuesta.ok) {
    throw new Error(data.error || "Error al listar honorarios");
  }

  return data;
}

export async function anularHonorario(id, empresaId) {
  const token = obtenerToken();

  const respuesta = await fetch(`${API_URL}/honorarios/${id}/anular`, {
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
    throw new Error(data.error || "Error al anular honorario");
  }

  return data;
}

export async function contabilizarHonorario(id, empresaId) {
  const token = obtenerToken();

  const respuesta = await fetch(`${API_URL}/honorarios/${id}/contabilizar`, {
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
    throw new Error(data.error || "Error al contabilizar honorario");
  }

  return data;
}