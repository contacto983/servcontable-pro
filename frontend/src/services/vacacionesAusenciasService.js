import { obtenerToken } from "./authService";

import { API_BASE_URL } from "./apiConfig";

const API_URL = API_BASE_URL;

export async function listarVacacionesAusencias(filtros) {
  const token = obtenerToken();

  const params = new URLSearchParams();

  params.append("empresa_id", filtros.empresa_id);

  if (filtros.periodo) params.append("periodo", filtros.periodo);
  if (filtros.trabajador_id) params.append("trabajador_id", filtros.trabajador_id);
  if (filtros.tipo) params.append("tipo", filtros.tipo);

  const respuesta = await fetch(
    `${API_URL}/vacaciones-ausencias?${params.toString()}`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  const data = await respuesta.json();

  if (!respuesta.ok) {
    throw new Error(data.error || "Error al listar vacaciones y ausencias");
  }

  return data;
}

export async function crearVacacionAusencia(datos) {
  const token = obtenerToken();

  const respuesta = await fetch(`${API_URL}/vacaciones-ausencias`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(datos),
  });

  const data = await respuesta.json();

  if (!respuesta.ok) {
    throw new Error(data.error || "Error al guardar registro");
  }

  return data;
}

export async function obtenerResumenVacacionesAusenciasTrabajador(filtros) {
  const token = obtenerToken();

  const params = new URLSearchParams();

  params.append("empresa_id", filtros.empresa_id);
  params.append("trabajador_id", filtros.trabajador_id);

  if (filtros.periodo) {
    params.append("periodo", filtros.periodo);
  }

  const respuesta = await fetch(
    `${API_URL}/vacaciones-ausencias/resumen-trabajador?${params.toString()}`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  const data = await respuesta.json();

  if (!respuesta.ok) {
    throw new Error(data.error || "Error al obtener resumen del trabajador");
  }

  return data;
}

export async function eliminarVacacionAusencia(id, empresaId) {
  const token = obtenerToken();

  const respuesta = await fetch(`${API_URL}/vacaciones-ausencias/${id}`, {
    method: "DELETE",
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
    throw new Error(data.error || "Error al eliminar registro");
  }

  return data;
}