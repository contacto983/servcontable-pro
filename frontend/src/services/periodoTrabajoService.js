import { obtenerEjercicioActivo } from "./ejerciciosService";

function pad(numero) {
  return String(numero).padStart(2, "0");
}

export function obtenerAnioActivo() {
  const ejercicio = obtenerEjercicioActivo();
  return ejercicio?.anio || new Date().getFullYear();
}

export function obtenerMesActual() {
  return String(new Date().getMonth() + 1).padStart(2, "0");
}

export function obtenerPeriodoTrabajo(mes = null) {
  const anio = obtenerAnioActivo();
  const mesFinal = mes || obtenerMesActual();

  return `${anio}-${mesFinal}`;
}

export function obtenerPeriodoAnterior(periodo = obtenerPeriodoTrabajo()) {
  const [anioTxt, mesTxt] = String(periodo || "").split("-");
  const anio = Number(anioTxt);
  const mes = Number(mesTxt);

  if (!anio || !mes) return obtenerPeriodoTrabajo();

  const fecha = new Date(anio, mes - 1, 1);
  fecha.setMonth(fecha.getMonth() - 1);

  const anioAnterior = fecha.getFullYear();
  const mesAnterior = String(fecha.getMonth() + 1).padStart(2, "0");

  return `${anioAnterior}-${mesAnterior}`;
}

export function obtenerFechaHoyISO() {
  const hoy = new Date();
  const anio = hoy.getFullYear();
  const mes = pad(hoy.getMonth() + 1);
  const dia = pad(hoy.getDate());

  return `${anio}-${mes}-${dia}`;
}

export function obtenerRangoAnualTrabajo() {
  const anio = Number(obtenerAnioActivo());
  return {
    fechaDesde: `${anio}-01-01`,
    fechaHasta: `${anio}-12-31`,
  };
}

export function obtenerFechaTrabajoHoyISO() {
  const anio = Number(obtenerAnioActivo());
  const hoy = new Date();
  const mes = hoy.getMonth() + 1;
  const dia = hoy.getDate();

  const ultimoDiaMes = new Date(anio, mes, 0).getDate();
  const diaAjustado = Math.min(dia, ultimoDiaMes);

  return `${anio}-${pad(mes)}-${pad(diaAjustado)}`;
}

export function obtenerRangoPeriodoTrabajo(periodo = obtenerPeriodoTrabajo()) {
  const [anioTxt, mesTxt] = String(periodo || "").split("-");
  const anio = Number(anioTxt);
  const mes = Number(mesTxt);

  if (!anio || !mes) {
    return obtenerRangoAnualTrabajo();
  }

  const ultimoDia = new Date(anio, mes, 0).getDate();

  return {
    fechaDesde: `${anio}-${pad(mes)}-01`,
    fechaHasta: `${anio}-${pad(mes)}-${pad(ultimoDia)}`,
  };
}

export function obtenerUltimoDiaPeriodo(periodo = obtenerPeriodoTrabajo()) {
  const [anioTxt, mesTxt] = String(periodo || "").split("-");
  const anio = Number(anioTxt);
  const mes = Number(mesTxt);

  if (!anio || !mes) return obtenerFechaHoyISO();

  const ultimoDia = new Date(anio, mes, 0).getDate();
  return `${anio}-${pad(mes)}-${pad(ultimoDia)}`;
}

export function ejercicioEstaCerrado() {
  const ejercicio = obtenerEjercicioActivo();
  return ejercicio?.estado === "cerrado";
}
