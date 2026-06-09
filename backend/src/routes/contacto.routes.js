const express = require("express");
const {
  crearSolicitudContacto,
  listarSolicitudesContacto,
  actualizarSolicitudContacto,
  activarDemoSolicitud,
} = require("../controllers/contacto.controller");

const { verificarToken } = require("../middleware/auth.middleware");
const { soloAdminSistema } = require("../middleware/adminSistema.middleware");

const router = express.Router();

router.post("/", crearSolicitudContacto);

router.get("/", verificarToken, soloAdminSistema, listarSolicitudesContacto);

router.post("/:id/activar-demo", verificarToken, soloAdminSistema, activarDemoSolicitud);

router.patch("/:id", verificarToken, soloAdminSistema, actualizarSolicitudContacto);

module.exports = router;
