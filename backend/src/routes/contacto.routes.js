const express = require("express");
const {
  crearSolicitudContacto,
  listarSolicitudesContacto,
  actualizarSolicitudContacto,
} = require("../controllers/contacto.controller");

const { verificarToken } = require("../middleware/auth.middleware");

const router = express.Router();

router.post("/", crearSolicitudContacto);

router.get("/", verificarToken, listarSolicitudesContacto);

router.patch("/:id", verificarToken, actualizarSolicitudContacto);

module.exports = router;