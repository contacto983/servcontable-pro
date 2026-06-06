import { obtenerToken } from "./authService";

import { API_BASE_URL } from "./apiConfig";

const API_URL = API_BASE_URL;

export async function crearCompra(datosCompra) {
  const token = obtenerToken();

  const respuesta = await fetch(`${API_URL}/compras`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(datosCompra),
  });

  const data = await respuesta.json();

  if (!respuesta.ok) {
    throw new Error(data.error || "Error al registrar compra");
  }

  return data;
}

export async function listarCompras(empresaId, fechaDesde = "", fechaHasta = "") {
  const token = obtenerToken();

  const params = new URLSearchParams();
  params.append("empresa_id", empresaId);

  if (fechaDesde) {
    params.append("fecha_desde", fechaDesde);
  }

  if (fechaHasta) {
    params.append("fecha_hasta", fechaHasta);
  }

  const respuesta = await fetch(`${API_URL}/compras?${params.toString()}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await respuesta.json();

  if (!respuesta.ok) {
    throw new Error(data.error || "Error al listar compras");
  }

  return data;
}

export async function importarComprasSII(
  empresaId,
  archivo,
  generarComprobante = true
) {
  const token = obtenerToken();

  const formData = new FormData();
  formData.append("empresa_id", empresaId);
  formData.append(
    "generar_comprobante",
    generarComprobante ? "true" : "false"
  );
  formData.append("archivo", archivo);

  const respuesta = await fetch(`${API_URL}/compras/importar-sii`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });

  const data = await respuesta.json();

  if (!respuesta.ok) {
    throw new Error(data.error || "Error al importar compras SII");
  }

  return data;
}
