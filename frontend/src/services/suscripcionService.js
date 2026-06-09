import { API_BASE_URL } from "./apiConfig";
import { obtenerToken } from "./authService";

export async function crearRenovacionMercadoPago(datosRenovacion) {
  const token = obtenerToken();

  const respuesta = await fetch(`${API_BASE_URL}/pagos-mercadopago/renovar`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(datosRenovacion),
  });

  const data = await respuesta.json();

  if (!respuesta.ok) {
    throw new Error(data.error || "No se pudo iniciar la renovación.");
  }

  return data;
}
