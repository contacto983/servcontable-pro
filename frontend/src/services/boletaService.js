import { obtenerToken } from "./authService";
import { API_BASE_URL } from "./apiConfig";

const API_URL = API_BASE_URL;

export async function listarBoletas(empresaId, fechaDesde = "", fechaHasta = "") {
  const token = obtenerToken();
  const params = new URLSearchParams();
  params.append("empresa_id", empresaId);

  if (fechaDesde) params.append("fecha_desde", fechaDesde);
  if (fechaHasta) params.append("fecha_hasta", fechaHasta);

  const respuesta = await fetch(`${API_URL}/boletas?${params.toString()}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await respuesta.json();

  if (!respuesta.ok) {
    throw new Error(data.error || "Error al listar boletas");
  }

  return data;
}

export async function importarBoletas(
  empresaId,
  archivo,
  generarComprobante = true,
  periodo = ""
) {
  const token = obtenerToken();
  const formData = new FormData();
  formData.append("empresa_id", empresaId);
  formData.append("generar_comprobante", generarComprobante ? "true" : "false");
  if (periodo) formData.append("periodo", periodo);
  formData.append("archivo", archivo);

  const respuesta = await fetch(`${API_URL}/boletas/importar-sii`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });

  const data = await respuesta.json();

  if (!respuesta.ok) {
    throw new Error(data.error || "Error al importar boletas SII");
  }

  return data;
}
