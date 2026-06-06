import { obtenerToken } from "./authService";

import { API_BASE_URL } from "./apiConfig";

const API_URL = API_BASE_URL;

export async function obtenerResumenF29(empresaId, periodo, tasaPPM) {
  const token = obtenerToken();

  const params = new URLSearchParams();
  params.append("empresa_id", empresaId);
  params.append("periodo", periodo);
  params.append("tasa_ppm", tasaPPM);

  const respuesta = await fetch(`${API_URL}/resumen-f29?${params.toString()}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await respuesta.json();

  if (!respuesta.ok) {
    throw new Error(data.error || "Error al obtener resumen F29");
  }

  return data;
}