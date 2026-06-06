import { obtenerToken } from "./authService";

import { API_BASE_URL } from "./apiConfig";

const API_URL = API_BASE_URL;

export async function obtenerCuentasPorCobrar(
  empresaId,
  fechaDesde,
  fechaHasta
) {
  const token = obtenerToken();

  const params = new URLSearchParams();
  params.append("empresa_id", empresaId);
  params.append("fecha_desde", fechaDesde);
  params.append("fecha_hasta", fechaHasta);

  const respuesta = await fetch(
    `${API_URL}/cuentas-pendientes/por-cobrar?${params.toString()}`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  const data = await respuesta.json();

  if (!respuesta.ok) {
    throw new Error(data.error || "Error al obtener cuentas por cobrar");
  }

  return data;
}

export async function obtenerCuentasPorPagar(
  empresaId,
  fechaDesde,
  fechaHasta
) {
  const token = obtenerToken();

  const params = new URLSearchParams();
  params.append("empresa_id", empresaId);
  params.append("fecha_desde", fechaDesde);
  params.append("fecha_hasta", fechaHasta);

  const respuesta = await fetch(
    `${API_URL}/cuentas-pendientes/por-pagar?${params.toString()}`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  const data = await respuesta.json();

  if (!respuesta.ok) {
    throw new Error(data.error || "Error al obtener cuentas por pagar");
  }

  return data;
}