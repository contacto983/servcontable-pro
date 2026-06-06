require("dotenv").config();

const { validarEntorno } = require("./config/env");
const pool = require("./database/db");
const { inicializarAuth } = require("./helpers/auth.helper");
const app = require("./app");

const PORT = process.env.PORT || 4000;

validarEntorno();

inicializarAuth(pool)
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Servidor backend funcionando en puerto ${PORT}`);
    });
  })
  .catch((error) => {
    console.error("No se pudo inicializar autenticacion:", error);
    process.exit(1);
  });
