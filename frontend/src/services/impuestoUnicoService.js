import { obtenerToken } from "./authService";

import { API_BASE_URL } from "./apiConfig";

const API_URL = API_BASE_URL;

export async function listarTramosImpuestoUnico(empresaId, periodo) {
  const token = obtenerToken();

  const params = new URLSearchParams();
  params.append("empresa_id", empresaId);
  params.append("periodo", periodo);

  const respuesta = await fetch(
    `${API_URL}/impuesto-unico?${params.toString()}`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  const data = await respuesta.json();

  if (!respuesta.ok) {
    throw new Error(data.error || "Error al listar tramos de impuesto Ãºnico");
  }

  return data;
}

export async function guardarTramoImpuestoUnico(datos) {
  const token = obtenerToken();

  const respuesta = await fetch(`${API_URL}/impuesto-unico`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(datos),
  });

  const data = await respuesta.json();

  if (!respuesta.ok) {
    throw new Error(data.error || "Error al guardar tramo de impuesto Ãºnico");
  }

  return data;
}

export async function eliminarTramoImpuestoUnico(id, empresaId) {
  const token = obtenerToken();

  const respuesta = await fetch(`${API_URL}/impuesto-unico/${id}/eliminar`, {
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
    throw new Error(data.error || "Error al eliminar tramo de impuesto Ãºnico");
  }

  return data;
}

export async function eliminarTramosPeriodo(empresaId, periodo) {
  const token = obtenerToken();

  const respuesta = await fetch(`${API_URL}/impuesto-unico/periodo/eliminar`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      empresa_id: empresaId,
      periodo,
    }),
  });

  const data = await respuesta.json();

  if (!respuesta.ok) {
    throw new Error(data.error || "Error al eliminar tramos del perÃ­odo");
  }

  return data;
}