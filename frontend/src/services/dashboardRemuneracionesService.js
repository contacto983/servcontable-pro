import { listarTrabajadores } from "./trabajadoresService";
import { listarLiquidaciones } from "./liquidacionesService";
import { obtenerPagosRemuneraciones } from "./pagosRemuneracionesService";
import { listarHaberesDescuentos } from "./haberesDescuentosService";

export async function obtenerDashboardRemuneraciones(empresaId, periodo) {
  const [trabajadoresData, liquidacionesData, pagosData, variablesData] =
    await Promise.all([
      listarTrabajadores(empresaId, "activo"),
      listarLiquidaciones(empresaId, periodo),
      obtenerPagosRemuneraciones(empresaId, periodo),
      listarHaberesDescuentos(empresaId, periodo),
    ]);

  const trabajadores = trabajadoresData.trabajadores || [];
  const liquidaciones = liquidacionesData.liquidaciones || [];
  const pagos = pagosData.pagos || [];
  const resumenPagos = pagosData.resumen || [];

  const totalTrabajadores = trabajadores.length;
  const totalLiquidaciones = liquidaciones.length;

  const liquidacionesContabilizadas = liquidaciones.filter(
    (item) => item.contabilizada
  ).length;

  const liquidacionesPendientes = liquidaciones.filter(
    (item) => !item.contabilizada
  ).length;

  const totalHaberes = liquidaciones.reduce(
    (acc, item) => acc + Number(item.total_haberes || 0),
    0
  );

  const totalDescuentos = liquidaciones.reduce(
    (acc, item) => acc + Number(item.total_descuentos || 0),
    0
  );

  const totalLiquido = liquidaciones.reduce(
    (acc, item) => acc + Number(item.liquido_pagar || 0),
    0
  );

  const totalCostoEmpresa = liquidaciones.reduce(
    (acc, item) => acc + Number(item.costo_empresa || 0),
    0
  );

  const totalCotizaciones = liquidaciones.reduce((acc, item) => {
    return (
      acc +
      Number(item.descuento_afp || 0) +
      Number(item.descuento_salud || 0) +
      Number(item.descuento_afc || 0) +
      Number(item.aporte_sis_empleador || 0) +
      Number(item.aporte_afc_empleador || 0) +
      Number(item.aporte_mutual_empleador || 0)
    );
  }, 0);

  const totalPagado = pagos.reduce(
    (acc, item) => acc + Number(item.monto || 0),
    0
  );

  const saldoPendientePagos = resumenPagos.reduce(
    (acc, item) => acc + Number(item.saldo_pendiente || 0),
    0
  );

  const variables = variablesData.totales || {
    haberes_imponibles: 0,
    haberes_no_imponibles: 0,
    descuentos: 0,
    total_general: 0,
  };

  return {
    trabajadores,
    liquidaciones,
    pagos,
    resumenPagos,
    variables,
    indicadores: {
      totalTrabajadores,
      totalLiquidaciones,
      liquidacionesContabilizadas,
      liquidacionesPendientes,
      totalHaberes,
      totalDescuentos,
      totalLiquido,
      totalCostoEmpresa,
      totalCotizaciones,
      totalPagado,
      saldoPendientePagos,
    },
  };
}