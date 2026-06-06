const express = require("express");
const router = express.Router();

const {
  crearEmpresa,
  listarEmpresas,
} = require("../controllers/empresas.controller");

const { verificarToken } = require("../middleware/auth.middleware");
const { limitarEmpresasDemo } = require("../middleware/demo.middleware");

router.post("/", verificarToken, limitarEmpresasDemo(1), crearEmpresa);
router.get("/", verificarToken, listarEmpresas);

module.exports = router;
