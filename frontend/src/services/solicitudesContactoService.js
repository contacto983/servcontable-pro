import { API_BASE_URL } from "./apiConfig";

function buscarTokenEnValor(valor) {
  if (!valor) return "";

  if (typeof valor === "string") {
    const encontrado = valor.match(/eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/);
    return encontrado ? encontrado[0] : "";
  }

  if (typeof valor === "object") {
    for (const clave of Object.keys(valor)) {
      const encontrado = buscarTokenEnValor(valor[clave]);
      if (encontrado) return encontrado;
    }
  }

  return "";
}

function buscarTokenEnStorage(storage) {
  for (let i = 0; i < storage.length; i += 1) {
    const clave = storage.key(i);
    const valor = storage.getItem(clave);

    if (!valor) continue;

    const tokenDirecto = buscarTokenEnValor(valor);
    if (tokenDirecto) return tokenDirecto;

    try {
      const json = JSON.parse(valor);
      const tokenJson = buscarTokenEnValor(json);
      if (tokenJson) return tokenJson;
    } catch {
      // Ignorar valores que no son JSON.
    }
  }

  return "";
}

function obtenerToken() {
  return (
    buscarTokenEnStorage(sessionStorage) ||
    buscarTokenEnStorage(localStorage) ||
    ""
  );
}

function headersJson() {
  const token = obtenerToken();

  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function leerRespuestaJson(respuesta) {
  try {
    return await respuesta.json();
  } catch {
    return {};
  }
}

export async function crearSolicitudContacto(payload = {}) {
  const respuesta = await fetch(API_BASE_URL + "/contacto", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const data = await leerRespuestaJson(respuesta);

  if (!respuesta.ok) {
    throw new Error(data.error || "No se pudo enviar la solicitud.");
  }

  return data.solicitud;
}

export async function listarSolicitudesContacto() {
  const respuesta = await fetch(`${API_BASE_URL}/contacto`, {
    method: "GET",
    headers: headersJson(),
  });

  const data = await leerRespuestaJson(respuesta);

  if (!respuesta.ok) {
    throw new Error(data.error || "No se pudieron cargar las solicitudes.");
  }

  return data.solicitudes || [];
}

export async function listarPagosMercadoPago() {
  const respuesta = await fetch(`${API_BASE_URL}/pagos-mercadopago`, {
    method: "GET",
    headers: headersJson(),
  });

  const data = await leerRespuestaJson(respuesta);

  if (!respuesta.ok) {
    throw new Error(data.error || "No se pudieron cargar los pagos de Mercado Pago.");
  }

  return data.pagos || [];
}

export async function actualizarSolicitudContacto(id, payload = {}) {
  const respuesta = await fetch(`${API_BASE_URL}/contacto/${id}`, {
    method: "PATCH",
    headers: headersJson(),
    body: JSON.stringify(payload),
  });

  const data = await leerRespuestaJson(respuesta);

  if (!respuesta.ok) {
    throw new Error(data.error || "No se pudo actualizar la solicitud.");
  }

  return data.solicitud;
}


export async function activarDemoSolicitud(id, dias = 30) {
  const respuesta = await fetch(API_BASE_URL + "/contacto/" + id + "/activar-demo", {
    method: "POST",
    headers: headersJson(),
    body: JSON.stringify({ dias }),
  });

  const data = await leerRespuestaJson(respuesta);

  if (!respuesta.ok) {
    throw new Error(data.error || "No se pudo activar la demo.");
  }

  return data;
}
