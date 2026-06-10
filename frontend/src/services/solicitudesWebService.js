import { crearUrlApi } from "./apiConfig";
import { obtenerToken } from "./authService";

async function leerRespuesta(respuesta, mensajeError) {
  const data = await respuesta.json();

  if (!respuesta.ok) {
    throw new Error(data.error || mensajeError);
  }

  return data;
}

export async function listarSolicitudesWeb() {
  const token = obtenerToken();

  const respuesta = await fetch(crearUrlApi("/pagos-mercadopago/contrataciones"), {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return leerRespuesta(respuesta, "No se pudieron obtener las solicitudes web");
}

export async function marcarSolicitudContactada(id) {
  const token = obtenerToken();

  const respuesta = await fetch(
    crearUrlApi(`/pagos-mercadopago/contrataciones/${id}/gestion`),
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ estado_gestion: "contactado" }),
    }
  );

  return leerRespuesta(respuesta, "No se pudo actualizar la solicitud web");
}
