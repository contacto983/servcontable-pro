import { obtenerToken } from "./authService";

import { API_BASE_URL } from "./apiConfig";

const API_URL = API_BASE_URL;

export async function listarHaberesDescuentos(
  empresaId,
  periodo,
  trabajadorId = "",
  incluirRecurrentes = true
) {
  const token = obtenerToken();

  const params = new URLSearchParams();
  params.append("empresa_id", empresaId);
  params.append("periodo", periodo);
  params.append("incluir_recurrentes", incluirRecurrentes ? "true" : "false");

  if (trabajadorId) {
    params.append("trabajador_id", trabajadorId);
  }

  const respuesta = await fetch(
    `${API_URL}/haberes-descuentos?${params.toString()}`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  const data = await respuesta.json();

  if (!respuesta.ok) {
    throw new Error(data.error || "Error al listar haberes/descuentos");
  }

  return data;
}

export async function crearHaberDescuento(datos) {
  const token = obtenerToken();

  const respuesta = await fetch(`${API_URL}/haberes-descuentos`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(datos),
  });

  const data = await respuesta.json();

  if (!respuesta.ok) {
    throw new Error(data.error || "Error al crear haber/descuento");
  }

  return data;
}

export async function actualizarHaberDescuento(id, datos) {
  const token = obtenerToken();

  const respuesta = await fetch(`${API_URL}/haberes-descuentos/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(datos),
  });

  const data = await respuesta.json();

  if (!respuesta.ok) {
    throw new Error(data.error || "Error al actualizar haber/descuento");
  }

  return data;
}

export async function cambiarRecurrenteHaberDescuento(id, empresaId, recurrente) {
  const token = obtenerToken();

  const body = { empresa_id: empresaId };
  if (typeof recurrente === "boolean") {
    body.recurrente = recurrente;
  }

  const respuesta = await fetch(`${API_URL}/haberes-descuentos/${id}/recurrente`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });

  const data = await respuesta.json();

  if (!respuesta.ok) {
    throw new Error(data.error || "Error al actualizar recurrencia");
  }

  return data;
}

export async function obtenerResumenHaberesLiquidacion(
  empresaId,
  trabajadorId,
  periodo,
  incluirRecurrentes = true
) {
  const token = obtenerToken();

  const params = new URLSearchParams();
  params.append("empresa_id", empresaId);
  params.append("trabajador_id", trabajadorId);
  params.append("periodo", periodo);
  params.append("incluir_recurrentes", incluirRecurrentes ? "true" : "false");

  const respuesta = await fetch(
    `${API_URL}/haberes-descuentos/resumen-liquidacion?${params.toString()}`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  const data = await respuesta.json();

  if (!respuesta.ok) {
    throw new Error(
      data.error || "Error al obtener resumen de haberes/descuentos"
    );
  }

  return data;
}

export async function eliminarHaberDescuento(id, empresaId) {
  const token = obtenerToken();

  const respuesta = await fetch(`${API_URL}/haberes-descuentos/${id}/eliminar`, {
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
    throw new Error(data.error || "Error al eliminar haber/descuento");
  }

  return data;
}
