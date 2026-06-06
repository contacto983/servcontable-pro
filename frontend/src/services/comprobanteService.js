import { obtenerToken } from "./authService";

import { API_BASE_URL } from "./apiConfig";

const API_URL = API_BASE_URL;

export async function crearComprobante(datosComprobante) {
  const token = obtenerToken();

  const respuesta = await fetch(`${API_URL}/comprobantes`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(datosComprobante),
  });

  const data = await respuesta.json();

  if (!respuesta.ok) {
    throw new Error(data.error || "Error al crear comprobante");
  }

  return data;
}

export async function listarComprobantes(empresaId, filtros = {}) {
  const token = obtenerToken();
  const params = new URLSearchParams();

  params.append("empresa_id", empresaId);

  if (filtros.anio) {
    params.append("anio", filtros.anio);
  }

  if (filtros.periodo) {
    params.append("periodo", filtros.periodo);
  }

  if (filtros.fecha_desde) {
    params.append("fecha_desde", filtros.fecha_desde);
  }

  if (filtros.fecha_hasta) {
    params.append("fecha_hasta", filtros.fecha_hasta);
  }

  const respuesta = await fetch(
    `${API_URL}/comprobantes?${params.toString()}`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  const data = await respuesta.json();

  if (!respuesta.ok) {
    throw new Error(data.error || "Error al listar comprobantes");
  }

  return data;
}

export async function obtenerComprobante(id) {
  const token = obtenerToken();

  const respuesta = await fetch(`${API_URL}/comprobantes/${id}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await respuesta.json();

  if (!respuesta.ok) {
    throw new Error(data.error || "Error al obtener comprobante");
  }

  return data;
}

export async function actualizarComprobante(id, datosComprobante) {
  const token = obtenerToken();

  const respuesta = await fetch(`${API_URL}/comprobantes/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(datosComprobante),
  });

  const data = await respuesta.json();

  if (!respuesta.ok) {
    throw new Error(data.error || "Error al actualizar comprobante");
  }

  return data;
}

export async function obtenerSiguienteNumeroComprobante(empresaId, tipo) {
  const token = obtenerToken();

  const params = new URLSearchParams();
  params.append("empresa_id", empresaId);
  params.append("tipo", tipo);

  const respuesta = await fetch(
    `${API_URL}/comprobantes/siguiente-numero?${params.toString()}`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  const data = await respuesta.json();

  if (!respuesta.ok) {
    throw new Error(data.error || "Error al obtener siguiente numero");
  }

  return data;
}
export async function anularComprobante(id, empresaId) {
  const token = obtenerToken();

  const respuesta = await fetch(`${API_URL}/comprobantes/${id}`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ empresa_id: empresaId }),
  });

  const data = await respuesta.json();

  if (!respuesta.ok) {
    throw new Error(data.error || "Error al eliminar comprobante");
  }

  return data;
}
