import { obtenerToken } from "./authService";

import { API_BASE_URL } from "./apiConfig";

const API_URL = API_BASE_URL;

export async function crearVenta(datosVenta) {
  const token = obtenerToken();

  const respuesta = await fetch(`${API_URL}/ventas`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(datosVenta),
  });

  const data = await respuesta.json();

  if (!respuesta.ok) {
    throw new Error(data.error || "Error al registrar venta");
  }

  return data;
}

export async function listarVentas(empresaId, fechaDesde = "", fechaHasta = "") {
  const token = obtenerToken();

  const params = new URLSearchParams();
  params.append("empresa_id", empresaId);

  if (fechaDesde) {
    params.append("fecha_desde", fechaDesde);
  }

  if (fechaHasta) {
    params.append("fecha_hasta", fechaHasta);
  }

  const respuesta = await fetch(`${API_URL}/ventas?${params.toString()}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await respuesta.json();

  if (!respuesta.ok) {
    throw new Error(data.error || "Error al listar ventas");
  }

  return data;
}

export async function importarVentasSII(
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

  const respuesta = await fetch(`${API_URL}/ventas/importar-sii`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });

  const data = await respuesta.json();

  if (!respuesta.ok) {
    throw new Error(data.error || "Error al importar ventas SII");
  }

  return data;
}
