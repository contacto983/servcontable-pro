function fechaHoyISO() {
  return new Date().toISOString().slice(0, 10);
}

function esRolSinBloqueo(rol) {
  return ["superadmin", "admin", "administrador_sistema"].includes(
    String(rol || "").trim().toLowerCase()
  );
}

function normalizarFechaISO(valor) {
  if (!valor) return null;

  if (valor instanceof Date) {
    return valor.toISOString().slice(0, 10);
  }

  const texto = String(valor).trim();
  const match = texto.match(/^\d{4}-\d{2}-\d{2}/);

  return match ? match[0] : null;
}

function diferenciaDias(fechaVence) {
  if (!fechaVence) return null;

  const hoy = new Date(fechaHoyISO() + "T00:00:00");
  const vence = new Date(fechaVence + "T00:00:00");
  const msDia = 24 * 60 * 60 * 1000;

  return Math.ceil((vence.getTime() - hoy.getTime()) / msDia);
}

async function asegurarEsquemaSuscripcion(db) {
  await db.query(`
    ALTER TABLE usuarios
      ADD COLUMN IF NOT EXISTS suscripcion_estado VARCHAR(30) NOT NULL DEFAULT 'activa',
      ADD COLUMN IF NOT EXISTS suscripcion_plan VARCHAR(30) NOT NULL DEFAULT 'mensual',
      ADD COLUMN IF NOT EXISTS suscripcion_inicio DATE,
      ADD COLUMN IF NOT EXISTS suscripcion_vence DATE,
      ADD COLUMN IF NOT EXISTS suscripcion_usuarios_adicionales INTEGER NOT NULL DEFAULT 0,
      ADD COLUMN IF NOT EXISTS suscripcion_pago_external_reference VARCHAR(120),
      ADD COLUMN IF NOT EXISTS suscripcion_actualizada_en TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW();
  `);
}

function construirSuscripcionPublica(usuario = {}, opciones = {}) {
  const demo = usuario.demo === true || opciones.demo === true;
  const sinBloqueo = demo || esRolSinBloqueo(usuario.rol);
  const fechaVence = normalizarFechaISO(usuario.suscripcion_vence);
  const diasRestantes = diferenciaDias(fechaVence);
  const vencida =
    !sinBloqueo &&
    Boolean(fechaVence) &&
    String(usuario.suscripcion_estado || "activa").toLowerCase() !== "cancelada" &&
    diasRestantes < 0;

  return {
    estado: sinBloqueo ? "activa" : usuario.suscripcion_estado || "activa",
    plan: usuario.suscripcion_plan || "mensual",
    inicio: normalizarFechaISO(usuario.suscripcion_inicio),
    vence: fechaVence,
    vencida,
    dias_restantes: diasRestantes,
    usuarios_adicionales: Number(usuario.suscripcion_usuarios_adicionales || 0),
    pago_external_reference: usuario.suscripcion_pago_external_reference || null,
    actualizada_en: usuario.suscripcion_actualizada_en || null,
  };
}

async function extenderSuscripcionUsuario(
  db,
  usuarioId,
  meses,
  plan,
  usuariosAdicionales,
  externalReference
) {
  const mesesNormalizados = Math.max(1, Math.floor(Number(meses) || 1));
  const usuariosExtra = Math.max(0, Math.floor(Number(usuariosAdicionales) || 0));

  const resultado = await db.query(
    `
    UPDATE usuarios
    SET
      suscripcion_estado = 'activa',
      suscripcion_plan = $2,
      suscripcion_inicio = COALESCE(suscripcion_inicio, CURRENT_DATE),
      suscripcion_vence = (
        GREATEST(COALESCE(suscripcion_vence, CURRENT_DATE), CURRENT_DATE)
        + ($3::int * INTERVAL '1 month')
      )::date,
      suscripcion_usuarios_adicionales = $4,
      suscripcion_pago_external_reference = $5,
      suscripcion_actualizada_en = NOW(),
      activo = true
    WHERE id = $1
    RETURNING *
    `,
    [usuarioId, plan || "mensual", mesesNormalizados, usuariosExtra, externalReference || null]
  );

  return resultado.rows[0] || null;
}

module.exports = {
  asegurarEsquemaSuscripcion,
  construirSuscripcionPublica,
  extenderSuscripcionUsuario,
};
