const pool = require("../database/db");
const { enviarCorreoSolicitudContacto } = require("../helpers/mail.helper");

async function asegurarTablaContacto() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS solicitudes_contacto (
      id SERIAL PRIMARY KEY,
      nombre VARCHAR(150) NOT NULL,
      correo VARCHAR(200) NOT NULL,
      empresa VARCHAR(200),
      interes VARCHAR(150),
      mensaje TEXT,
      estado VARCHAR(50) DEFAULT 'pendiente',
      origen VARCHAR(100) DEFAULT 'web',
      creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  await pool.query(`
    ALTER TABLE solicitudes_contacto
    ADD COLUMN IF NOT EXISTS leido BOOLEAN DEFAULT false;
  `);

  await pool.query(`
    ALTER TABLE solicitudes_contacto
    ADD COLUMN IF NOT EXISTS actualizado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
  `);

  await pool.query(`
    ALTER TABLE solicitudes_contacto
    ADD COLUMN IF NOT EXISTS nota_interna TEXT;
  `);
}

function limpiarTexto(valor) {
  if (valor === undefined || valor === null) return "";
  return String(valor).trim();
}

async function crearSolicitudContacto(req, res) {
  try {
    await asegurarTablaContacto();

    const nombre = limpiarTexto(req.body.nombre);
    const correo = limpiarTexto(req.body.correo || req.body.email);
    const empresa = limpiarTexto(req.body.empresa);
    const interes = limpiarTexto(
      req.body.interes || req.body.interes_principal || req.body.interesPrincipal
    );
    const mensaje = limpiarTexto(req.body.mensaje);

    if (!nombre || !correo) {
      return res.status(400).json({
        ok: false,
        error: "Nombre y correo son obligatorios.",
      });
    }

    const emailValido = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo);

    if (!emailValido) {
      return res.status(400).json({
        ok: false,
        error: "El correo ingresado no es valido.",
      });
    }

    const resultado = await pool.query(
      `
      INSERT INTO solicitudes_contacto
      (nombre, correo, empresa, interes, mensaje, origen)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id, nombre, correo, empresa, interes, mensaje, estado, origen, creado_en;
      `,
      [nombre, correo, empresa, interes, mensaje, "web"]
    );

    const solicitud = resultado.rows[0];

    try {
      console.log("Intentando enviar correo de solicitud web:", solicitud.id);

      const resultadoCorreo = await enviarCorreoSolicitudContacto(solicitud);

      console.log("Resultado envio correo solicitud web:", resultadoCorreo);
    } catch (errorCorreo) {
      console.error("Solicitud guardada, pero no se pudo enviar correo:", errorCorreo);
    }

    return res.status(201).json({
      ok: true,
      mensaje: "Solicitud enviada correctamente.",
      solicitud,
    });
  } catch (error) {
    console.error("Error al crear solicitud de contacto:", error);

    return res.status(500).json({
      ok: false,
      error: "No se pudo registrar la solicitud de contacto.",
    });
  }
}

async function listarSolicitudesContacto(req, res) {
  try {
    await asegurarTablaContacto();

    const limite = Math.min(Number(req.query.limite || 50), 200);

    const resultado = await pool.query(
      `
      SELECT
        id,
        nombre,
        correo,
        empresa,
        interes,
        mensaje,
        estado,
        leido,
        nota_interna,
        origen,
        creado_en,
        actualizado_en
      FROM solicitudes_contacto
      ORDER BY creado_en DESC
      LIMIT $1;
      `,
      [limite]
    );

    return res.json({
      ok: true,
      solicitudes: resultado.rows,
    });
  } catch (error) {
    console.error("Error al listar solicitudes de contacto:", error);

    return res.status(500).json({
      ok: false,
      error: "No se pudieron obtener las solicitudes.",
    });
  }
}

async function actualizarSolicitudContacto(req, res) {
  try {
    await asegurarTablaContacto();

    const { id } = req.params;

    const estado = limpiarTexto(req.body.estado || "contactado");
    const notaInterna = limpiarTexto(req.body.nota_interna || req.body.notaInterna);

    const resultado = await pool.query(
      `
      UPDATE solicitudes_contacto
      SET
        estado = $1,
        leido = true,
        nota_interna = COALESCE(NULLIF($2, ''), nota_interna),
        actualizado_en = CURRENT_TIMESTAMP
      WHERE id = $3
      RETURNING *;
      `,
      [estado, notaInterna, id]
    );

    if (resultado.rowCount === 0) {
      return res.status(404).json({
        ok: false,
        error: "Solicitud no encontrada.",
      });
    }

    return res.json({
      ok: true,
      mensaje: "Solicitud actualizada correctamente.",
      solicitud: resultado.rows[0],
    });
  } catch (error) {
    console.error("Error al actualizar solicitud de contacto:", error);

    return res.status(500).json({
      ok: false,
      error: "No se pudo actualizar la solicitud.",
    });
  }
}

module.exports = {
  crearSolicitudContacto,
  listarSolicitudesContacto,
  actualizarSolicitudContacto,
};