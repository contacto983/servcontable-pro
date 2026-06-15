import { obtenerToken } from "./authService";

import { API_BASE_URL } from "./apiConfig";

const API_URL = API_BASE_URL;

export async function obtenerPagosRemuneraciones(empresaId, periodo) {
  const token = obtenerToken();

  const params = new URLSearchParams();
  params.append("empresa_id", empresaId);
  params.append("periodo", periodo);

  const respuesta = await fetch(
    `${API_URL}/pagos-remuneraciones?${params.toString()}`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  const data = await respuesta.json();

  if (!respuesta.ok) {
    throw new Error(data.error || "Error al obtener pagos remuneraciones");
  }

  return data;
}

export async function registrarPagoRemuneracion(datos) {
  const token = obtenerToken();

  const respuesta = await fetch(`${API_URL}/pagos-remuneraciones`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(datos),
  });

  const data = await respuesta.json();

  if (!respuesta.ok) {
    throw new Error(data.error || "Error al registrar pago remuneración");
  }

  return data;
}

export async function anularPagoRemuneracion(id, empresaId) {
  const token = obtenerToken();

  const respuesta = await fetch(
    `${API_URL}/pagos-remuneraciones/${id}/anular`,
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        empresa_id: empresaId,
      }),
    }
  );

  const data = await respuesta.json();

  if (!respuesta.ok) {
    throw new Error(data.error || "Error al anular pago remuneración");
  }

  return data;
}