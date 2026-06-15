import { obtenerToken } from "./authService";

import { API_BASE_URL } from "./apiConfig";

const API_URL = API_BASE_URL;

export async function obtenerConfiguracionContable(empresaId) {
  const token = obtenerToken();

  const params = new URLSearchParams();
  params.append("empresa_id", empresaId);

  const respuesta = await fetch(
    `${API_URL}/configuracion-contable?${params.toString()}`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  const data = await respuesta.json();

  if (!respuesta.ok) {
    throw new Error(data.error || "Error al obtener configuración contable");
  }

  return data;
}

export async function guardarConfiguracionContable(datos) {
  const token = obtenerToken();

  const respuesta = await fetch(`${API_URL}/configuracion-contable`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(datos),
  });

  const data = await respuesta.json();

  if (!respuesta.ok) {
    throw new Error(data.error || "Error al guardar configuración contable");
  }

  return data;
}