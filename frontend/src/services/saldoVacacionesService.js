import { obtenerToken } from "./authService";

import { API_BASE_URL } from "./apiConfig";

const API_URL = API_BASE_URL;

export async function obtenerSaldoVacaciones({
  empresa_id,
  periodo,
  trabajador_id = "",
}) {
  const token = obtenerToken();

  const params = new URLSearchParams();

  params.append("empresa_id", empresa_id);
  params.append("periodo", periodo);

  if (trabajador_id) {
    params.append("trabajador_id", trabajador_id);
  }

  const respuesta = await fetch(
    `${API_URL}/saldo-vacaciones?${params.toString()}`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  const data = await respuesta.json();

  if (!respuesta.ok) {
    throw new Error(data.error || "Error al obtener saldo de vacaciones");
  }

  return data;
}

export async function obtenerHistorialVacacionesTrabajador({
  empresa_id,
  trabajador_id,
}) {
  const token = obtenerToken();

  const params = new URLSearchParams();

  params.append("empresa_id", empresa_id);
  params.append("trabajador_id", trabajador_id);

  const respuesta = await fetch(
    `${API_URL}/saldo-vacaciones/historial?${params.toString()}`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  const data = await respuesta.json();

  if (!respuesta.ok) {
    throw new Error(data.error || "Error al obtener historial de vacaciones");
  }

  return data;
}