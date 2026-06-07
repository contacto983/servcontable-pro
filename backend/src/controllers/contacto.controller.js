const pool = require("../database/db");

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
      RETURNING id, creado_en;
      `,
      [nombre, correo, empresa, interes, mensaje, "web"]
    );

    return res.status(201).json({
      ok: true,
      mensaje: "Solicitud enviada correctamente.",
      solicitud: resultado.rows[0],
    });
  } catch (error) {
    console.error("Error al crear solicitud de contacto:", error);

    return res.status(500).json({
      ok: false,
      error: "No se pudo registrar la solicitud de contacto.",
    });
  }
}

module.exports = {
  crearSolicitudContacto,
};