const express = require("express");
const cors = require("cors");
const { obtenerOrigenesCors } = require("./config/env");

const estadoRoutes = require("./routes/estado.routes");
const authRoutes = require("./routes/auth.routes");
const contactoRoutes = require("./routes/contacto.routes");
const pagosMercadoPagoRoutes = require("./routes/pagosMercadoPago.routes");
const empresasRoutes = require("./routes/empresas.routes");
const cuentasRoutes = require("./routes/cuentas.routes");
const comprobantesRoutes = require("./routes/comprobantes.routes");
const libroDiarioRoutes = require("./routes/libroDiario.routes");
const libroMayorRoutes = require("./routes/libroMayor.routes");
const balance8Routes = require("./routes/balance8.routes");
const estadoResultadosRoutes = require("./routes/estadoResultados.routes");
const ventasRoutes = require("./routes/ventas.routes");
const boletasRoutes = require("./routes/boletas.routes");
const comprasRoutes = require("./routes/compras.routes");
const resumenIVARoutes = require("./routes/resumenIVA.routes");
const resumenF29Routes = require("./routes/resumenF29.routes");
const remanenteIVARoutes = require("./routes/remanenteIVA.routes");
const configuracionContableRoutes = require("./routes/configuracionContable.routes");
const librosTributariosRoutes = require("./routes/librosTributarios.routes");
const honorariosRoutes = require("./routes/honorarios.routes");
const pagosCobrosRoutes = require("./routes/pagosCobros.routes");
const conciliacionBancariaRoutes = require("./routes/conciliacionBancaria.routes");
const cuentasPendientesRoutes = require("./routes/cuentasPendientes.routes");
const dashboardFinancieroRoutes = require("./routes/dashboardFinanciero.routes");
const trabajadoresRoutes = require("./routes/trabajadores.routes");
const liquidacionesRoutes = require("./routes/liquidaciones.routes");
const configuracionRemuneracionesRoutes = require("./routes/configuracionRemuneraciones.routes");
const pagosRemuneracionesRoutes = require("./routes/pagosRemuneraciones.routes");
const haberesDescuentosRoutes = require("./routes/haberesDescuentos.routes");
const impuestoUnicoRoutes = require("./routes/impuestoUnico.routes");
const finiquitosRoutes = require("./routes/finiquitos.routes");
const vacacionesAusenciasRoutes = require("./routes/vacacionesAusencias.routes");
const dashboardContableRoutes = require("./routes/dashboardContable.routes");
const analisisCuentasRoutes = require("./routes/analisisCuentas.routes");
const saldoVacacionesRoutes = require("./routes/saldoVacaciones.routes");
const planCuentasBaseRoutes = require("./routes/planCuentasBase.routes");
const ejerciciosRoutes = require("./routes/ejercicios.routes");
const auditoriaRoutes = require("./routes/auditoria.routes");


const app = express();

const origenesPermitidos = obtenerOrigenesCors();

app.use(
  cors({
    origin(origin, callback) {
      if (!origin) {
        return callback(null, true);
      }

      if (origenesPermitidos.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error("Origen no permitido por CORS"));
    },
    credentials: true,
  })
);
app.use(express.json());

app.use("/", estadoRoutes);
app.use("/api", estadoRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/contacto", contactoRoutes);
app.use("/api/pagos-mercadopago", pagosMercadoPagoRoutes);
app.use("/api/empresas", empresasRoutes);
app.use("/api/cuentas", cuentasRoutes);
app.use("/api/comprobantes", comprobantesRoutes);
app.use("/api/libro-diario", libroDiarioRoutes);
app.use("/api/libro-mayor", libroMayorRoutes);
app.use("/api/balance-8-columnas", balance8Routes);
app.use("/api/estado-resultados", estadoResultadosRoutes);
app.use("/api/ventas", ventasRoutes);
app.use("/api/boletas", boletasRoutes);
app.use("/api/compras", comprasRoutes);
app.use("/api/resumen-iva", resumenIVARoutes);
app.use("/api/resumen-f29", resumenF29Routes);
app.use("/api/remanente-iva", remanenteIVARoutes);
app.use("/api/configuracion-contable", configuracionContableRoutes);
app.use("/api/libros-tributarios", librosTributariosRoutes);
app.use("/api/honorarios", honorariosRoutes);
app.use("/api/pagos-cobros", pagosCobrosRoutes);
app.use("/api/conciliacion-bancaria", conciliacionBancariaRoutes);
app.use("/api/cuentas-pendientes", cuentasPendientesRoutes);
app.use("/api/dashboard-financiero", dashboardFinancieroRoutes);
app.use("/api/trabajadores", trabajadoresRoutes);
app.use("/api/liquidaciones", liquidacionesRoutes);
app.use("/api/configuracion-remuneraciones", configuracionRemuneracionesRoutes);
app.use("/api/pagos-remuneraciones", pagosRemuneracionesRoutes);
app.use("/api/haberes-descuentos", haberesDescuentosRoutes);
app.use("/api/impuesto-unico", impuestoUnicoRoutes);
app.use("/api/finiquitos", finiquitosRoutes);
app.use("/api/vacaciones-ausencias", vacacionesAusenciasRoutes);
app.use("/api/dashboard-contable", dashboardContableRoutes);
app.use("/api/analisis-cuentas", analisisCuentasRoutes);
app.use("/api/saldo-vacaciones", saldoVacacionesRoutes);
app.use("/api/plan-cuentas-base", planCuentasBaseRoutes);
app.use("/api/ejercicios", ejerciciosRoutes);
app.use("/api/auditoria", auditoriaRoutes);


module.exports = app;

