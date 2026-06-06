const API_URL_POR_DEFECTO = import.meta.env.DEV
  ? "http://localhost:4000/api"
  : "/api";

export const API_BASE_URL = (
  import.meta.env.VITE_API_URL || API_URL_POR_DEFECTO
).replace(/\/+$/, "");

export function crearUrlApi(ruta = "") {
  const path = ruta.startsWith("/") ? ruta : `/${ruta}`;
  return `${API_BASE_URL}${path}`;
}
