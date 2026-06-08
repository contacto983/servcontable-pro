const express = require("express");
const {
  crearCheckoutMercadoPago,
  webhookMercadoPago,
  listarPagosMercadoPago,
} = require("../controllers/pagosMercadoPago.controller");

const { verificarToken } = require("../middleware/auth.middleware");

const router = express.Router();

router.post("/checkout", crearCheckoutMercadoPago);

router.post("/webhook", webhookMercadoPago);

router.get("/", verificarToken, listarPagosMercadoPago);

module.exports = router;