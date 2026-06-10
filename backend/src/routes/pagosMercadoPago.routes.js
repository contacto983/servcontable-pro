const express = require("express");
const {
  crearPreferenciaContratacion,
  obtenerContratacion,
  listarContratacionesWeb,
  actualizarGestionContratacion,
  recibirWebhookMercadoPago,
} = require("../controllers/pagosMercadoPago.controller");
const {
  verificarToken,
  exigirAdministradorUsuarios,
} = require("../middleware/auth.middleware");

const router = express.Router();

router.post("/preferencia", crearPreferenciaContratacion);
router.post("/checkout", crearPreferenciaContratacion);
router.post("/webhook", recibirWebhookMercadoPago);
router.get(
  "/contrataciones",
  verificarToken,
  exigirAdministradorUsuarios,
  listarContratacionesWeb
);
router.patch(
  "/contrataciones/:id/gestion",
  verificarToken,
  exigirAdministradorUsuarios,
  actualizarGestionContratacion
);
router.get("/contratacion/:id", obtenerContratacion);

module.exports = router;
