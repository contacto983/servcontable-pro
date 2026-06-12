const pool = require("../database/db");
const {
  esAdminSistema,
  obtenerEmpresasPermitidas,
  asignarUsuarioEmpresa,
} = require("../helpers/auth.helper");

async function asegurarColumnasEmpresas(client) {
  await client.query(`
    ALTER TABLE empresas
      ADD COLUMN IF NOT EXISTS telefono VARCHAR(80),
      ADD COLUMN IF NOT EXISTS correo VARCHAR(180),
      ADD COLUMN IF NOT EXISTS descripcion_actividad TEXT,
      ADD COLUMN IF NOT EXISTS rut_representante VARCHAR(30),
      ADD COLUMN IF NOT EXISTS representante_legal VARCHAR(180),
      ADD COLUMN IF NOT EXISTS correo_representante VARCHAR(180),
      ADD COLUMN IF NOT EXISTS telefono_representante VARCHAR(80)
  `);
}

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
      telefono,
      correo,
      descripcion_actividad,
      rut_representante,
      representante_legal,
      correo_representante,
      telefono_representante,
    } = req.body;

    if (!rut || !razon_social) {
      return res.status(400).json({
        error: "RUT y razon social son obligatorios",
      });
    }

    await asegurarColumnasEmpresas(client);
    await client.query("BEGIN");
    transaccionIniciada = true;

    const nuevaEmpresa = await client.query(
      `INSERT INTO empresas
       (
         rut,
         razon_social,
         giro,
         direccion,
         comuna,
         ciudad,
         regimen_tributario,
         telefono,
         correo,
         descripcion_actividad,
         rut_representante,
         representante_legal,
         correo_representante,
         telefono_representante
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
       RETURNING *`,
      [
        rut,
        razon_social,
        giro || "",
        direccion || "",
        comuna || "",
        ciudad || "",
        regimen_tributario || "",
        telefono || "",
        correo || "",
        descripcion_actividad || "",
        rut_representante || "",
        representante_legal || "",
        correo_representante || "",
        telefono_representante || "",
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
    await asegurarColumnasEmpresas(pool);
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
