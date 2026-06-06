const pool = require("../database/db");
const {
  esAdminSistema,
  obtenerEmpresasPermitidas,
  asignarUsuarioEmpresa,
} = require("../helpers/auth.helper");

async function crearEmpresa(req, res) {
  const client = await pool.connect();
  let transaccionIniciada = false;

  try {
    const {
      rut,
      razon_social,
      giro,
      direccion,
      comuna,
      ciudad,
      regimen_tributario,
    } = req.body;

    if (!rut || !razon_social) {
      return res.status(400).json({
        error: "RUT y razon social son obligatorios",
      });
    }

    await client.query("BEGIN");
    transaccionIniciada = true;

    const nuevaEmpresa = await client.query(
      `INSERT INTO empresas
       (rut, razon_social, giro, direccion, comuna, ciudad, regimen_tributario)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        rut,
        razon_social,
        giro || "",
        direccion || "",
        comuna || "",
        ciudad || "",
        regimen_tributario || "",
      ]
    );

    const empresaCreada = nuevaEmpresa.rows[0];

    if (!esAdminSistema(req.usuario?.rol)) {
      await asignarUsuarioEmpresa(client, req.usuario.id, empresaCreada.id, "admin");
    }

    await client.query("COMMIT");
    transaccionIniciada = false;

    return res.status(201).json({
      mensaje: "Empresa creada correctamente",
      empresa: empresaCreada,
    });
  } catch (error) {
    if (transaccionIniciada) {
      await client.query("ROLLBACK");
    }

    console.error("Error al crear empresa:", error);

    return res.status(500).json({
      error: "Error interno al crear empresa",
    });
  } finally {
    client.release();
  }
}

async function listarEmpresas(req, res) {
  try {
    const empresas = await obtenerEmpresasPermitidas(pool, req.usuario);

    return res.json({
      total: empresas.length,
      empresas,
    });
  } catch (error) {
    console.error("Error al listar empresas:", error);

    return res.status(500).json({
      error: "Error interno al listar empresas",
    });
  }
}

module.exports = {
  crearEmpresa,
  listarEmpresas,
};
