const express = require("express");
const {
  crearCheckoutMercadoPago,
  crearRenovacionMercadoPago,
  webhookMercadoPago,
  obtenerEstadoContratacionMercadoPago,
  listarPagosMercadoPago,
} = require("../controllers/pagosMercadoPago.controller");

const { verificarToken } = require("../middleware/auth.middleware");
const { soloAdminSistema } = require("../middleware/adminSistema.middleware");

const router = express.Router();

router.post("/checkout", crearCheckoutMercadoPago);

router.post("/renovar", verificarToken, crearRenovacionMercadoPago);

router.post("/webhook", webhookMercadoPago);

router.get("/contratacion/:id", obtenerEstadoContratacionMercadoPago);

router.get("/", verificarToken, soloAdminSistema, listarPagosMercadoPago);

module.exports = router;
