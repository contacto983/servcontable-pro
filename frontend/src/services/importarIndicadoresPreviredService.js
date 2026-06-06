import { obtenerToken } from "./authService";

import { API_BASE_URL } from "./apiConfig";

const API_URL = API_BASE_URL;

export async function importarPDFIndicadoresPrevired(
  empresaId,
  periodo,
  archivo
) {
  const token = obtenerToken();

  const formData = new FormData();
  formData.append("empresa_id", empresaId);
  formData.append("periodo", periodo);
  formData.append("archivo", archivo);

  const respuesta = await fetch(`${API_URL}/importar-indicadores-previred/pdf`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });

  const data = await respuesta.json();

  if (!respuesta.ok) {
    throw new Error(data.error || "Error al importar PDF Previred");
  }

  return data;
}

export async function guardarIndicadoresPrevired(
  empresaId,
  periodo,
  indicadores,
  afps = []
) {
  const token = obtenerToken();

  const respuesta = await fetch(
    `${API_URL}/importar-indicadores-previred/guardar`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        empresa_id: empresaId,
        periodo,
        ...indicadores,
        afps,
      }),
    }
  );

  const data = await respuesta.json();

  if (!respuesta.ok) {
    throw new Error(data.error || "Error al guardar indicadores Previred");
  }

  return data;
}