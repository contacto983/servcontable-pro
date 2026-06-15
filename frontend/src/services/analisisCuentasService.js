import { obtenerToken } from "./authService";

import { API_BASE_URL } from "./apiConfig";

const API_URL = API_BASE_URL;

export async function obtenerAnalisisCuentas({
  empresa_id,
  fecha_desde,
  fecha_hasta,
  cuenta_id = "",
}) {
  const token = obtenerToken();

  const params = new URLSearchParams();

  params.append("empresa_id", empresa_id);
  params.append("fecha_desde", fecha_desde);
  params.append("fecha_hasta", fecha_hasta);

  if (cuenta_id) {
    params.append("cuenta_id", cuenta_id);
  }

  const respuesta = await fetch(
    `${API_URL}/analisis-cuentas?${params.toString()}`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  const data = await respuesta.json();

  if (!respuesta.ok) {
    throw new Error(data.error || "Error al obtener análisis de cuentas");
  }

  return data;
}

export async function obtenerMovimientosCuentaAnalisis({
  empresa_id,
  fecha_desde,
  fecha_hasta,
  cuenta_id,
}) {
  const token = obtenerToken();

  const params = new URLSearchParams();

  params.append("empresa_id", empresa_id);
  params.append("fecha_desde", fecha_desde);
  params.append("fecha_hasta", fecha_hasta);
  params.append("cuenta_id", cuenta_id);

  const respuesta = await fetch(
    `${API_URL}/analisis-cuentas/movimientos?${params.toString()}`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  const data = await respuesta.json();

  if (!respuesta.ok) {
    throw new Error(data.error || "Error al obtener movimientos de la cuenta");
  }

  return data;
}
