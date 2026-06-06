import { obtenerToken } from "./authService";

import { API_BASE_URL } from "./apiConfig";

const API_URL = API_BASE_URL;

export async function obtenerControlRemanenteIVA(empresaId, periodo) {
  const token = obtenerToken();

  const params = new URLSearchParams();
  params.append("empresa_id", empresaId);
  params.append("periodo", periodo);

  const respuesta = await fetch(
    `${API_URL}/remanente-iva?${params.toString()}`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  const data = await respuesta.json();

  if (!respuesta.ok) {
    throw new Error(data.error || "Error al obtener remanente IVA");
  }

  return data;
}

export async function guardarControlRemanenteIVA(datos) {
  const token = obtenerToken();

  const respuesta = await fetch(`${API_URL}/remanente-iva`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(datos),
  });

  const data = await respuesta.json();

  if (!respuesta.ok) {
    throw new Error(data.error || "Error al guardar remanente IVA");
  }

  return data;
}

export async function listarHistorialRemanenteIVA(empresaId) {
  const token = obtenerToken();

  const params = new URLSearchParams();
  params.append("empresa_id", empresaId);

  const respuesta = await fetch(
    `${API_URL}/remanente-iva/historial?${params.toString()}`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  const data = await respuesta.json();

  if (!respuesta.ok) {
    throw new Error(data.error || "Error al listar historial IVA");
  }

  return data;
}