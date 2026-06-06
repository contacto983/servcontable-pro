import { obtenerToken } from "./authService";

import { API_BASE_URL } from "./apiConfig";

const API_URL = API_BASE_URL;

export async function cargarPlanCuentasBase({ empresa_id, reemplazar = false }) {
  const token = obtenerToken();

  const respuesta = await fetch(`${API_URL}/plan-cuentas-base/cargar`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      empresa_id,
      reemplazar,
    }),
  });

  const data = await respuesta.json();

  if (!respuesta.ok) {
    throw new Error(data.error || "Error al cargar plan de cuentas base");
  }

  return data;
}