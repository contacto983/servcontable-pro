import { obtenerToken } from "./authService";

import { API_BASE_URL } from "./apiConfig";

const API_URL = API_BASE_URL;

export async function listarDocumentosPendientes(empresaId, tipo) {
  const token = obtenerToken();

  const params = new URLSearchParams();
  params.append("empresa_id", empresaId);
  params.append("tipo", tipo);

  const respuesta = await fetch(
    `${API_URL}/pagos-cobros/documentos-pendientes?${params.toString()}`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  const data = await respuesta.json();

  if (!respuesta.ok) {
    throw new Error(data.error || "Error al obtener documentos pendientes");
  }

  return data;
}

export async function listarPagosCobros(
  empresaId,
  fechaDesde,
  fechaHasta,
  incluirAnulados = false
) {
  const token = obtenerToken();

  const params = new URLSearchParams();
  params.append("empresa_id", empresaId);
  params.append("fecha_desde", fechaDesde);
  params.append("fecha_hasta", fechaHasta);
  params.append("incluir_anulados", incluirAnulados ? "true" : "false");

  const respuesta = await fetch(`${API_URL}/pagos-cobros?${params.toString()}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await respuesta.json();

  if (!respuesta.ok) {
    throw new Error(data.error || "Error al listar pagos/cobros");
  }

  return data;
}

export async function registrarPagoCobro(datos) {
  const token = obtenerToken();

  const respuesta = await fetch(`${API_URL}/pagos-cobros`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(datos),
  });

  const data = await respuesta.json();

  if (!respuesta.ok) {
    throw new Error(data.error || "Error al registrar pago/cobro");
  }

  return data;
}

export async function anularPagoCobro(id, empresaId) {
  const token = obtenerToken();

  const respuesta = await fetch(`${API_URL}/pagos-cobros/${id}/anular`, {
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
    throw new Error(data.error || "Error al anular pago/cobro");
  }

  return data;
}
