const express = require("express");
const { crearSolicitudContacto } = require("../controllers/contacto.controller");

const router = express.Router();

router.post("/", crearSolicitudContacto);

module.exports = router;