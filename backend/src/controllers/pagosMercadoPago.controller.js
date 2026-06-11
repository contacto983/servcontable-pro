const pool = require("../database/db");

const IVA = 0.19;
const PRECIO_USUARIO_ADICIONAL = 3990;
const MESES_ANUALES = 12;
const PLANES = {
  mensual: {
    periodicidad: "mensual",
    nombre: "ServContable PRO mensual",
    montoNeto: 16990,
  },
  anual: {
    periodicidad: "anual",
    nombre: "ServContable PRO anual",
    montoNeto: 14990 * 12,
  },
};

function limpiarTexto(valor) {
  if (valor === undefined || valor === null) return "";
  return String(valor).trim();
}

function validarCorreo(correo) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo);
}

function normalizarEnteroPositivo(valor) {
  const numero = Number.parseInt(valor, 10);
  return Number.isFinite(numero) && numero > 0 ? numero : 0;
}

function calcularTotales(periodicidad, usuariosAdicionales = 0) {
  const plan = PLANES[periodicidad] || PLANES.mensual;
  const mesesCobrados = periodicidad === "anual" ? MESES_ANUALES : 1;
  const usuariosAdicionalesNeto =
    PRECIO_USUARIO_ADICIONAL * usuariosAdicionales * mesesCobrados;
  const subtotalNeto = plan.montoNeto + usuariosAdicionalesNeto;
  const iva = Math.round(subtotalNeto * IVA);

  return {
    ...plan,
    usuariosAdicionales,
    mesesCobrados,
    planBaseNeto: plan.montoNeto,
    usuariosAdicionalesNeto,
    montoNeto: subtotalNeto,
    iva,
    total: subtotalNeto + iva,
  };
}

function obtenerBaseFrontend() {
  return (
    process.env.PUBLIC_BASE_URL ||
    process.env.FRONTEND_PUBLIC_URL ||
    process.env.FRONTEND_URL ||
    "https://www.servcontablepro.cl"
  ).replace(/\/+$/, "");
}

function obtenerWebhookUrl() {
  if (process.env.MP_WEBHOOK_URL) {
    return process.env.MP_WEBHOOK_URL.trim();
  }

  const backendBase = (
    process.env.BACKEND_PUBLIC_URL ||
    process.env.API_PUBLIC_URL ||
    "https://api.servcontablepro.cl"
  ).replace(/\/+$/, "");

  return `${backendBase}/api/pagos-mercadopago/webhook`;
}

async function asegurarTablaContrataciones() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS contrataciones_web (
      id SERIAL PRIMARY KEY,
      nombre VARCHAR(180) NOT NULL,
      correo VARCHAR(220) NOT NULL,
      telefono VARCHAR(80),
      rut VARCHAR(40),
      empresa VARCHAR(220),
      periodicidad VARCHAR(30) NOT NULL DEFAULT 'mensual',
      monto_neto INTEGER NOT NULL DEFAULT 0,
      iva INTEGER NOT NULL DEFAULT 0,
      total INTEGER NOT NULL DEFAULT 0,
      estado VARCHAR(60) NOT NULL DEFAULT 'pendiente',
      mp_preference_id VARCHAR(160),
      mp_payment_id VARCHAR(160),
      mp_status VARCHAR(80),
      mp_status_detail VARCHAR(160),
      origen VARCHAR(80) DEFAULT 'web',
      creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      actualizado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  await pool.query(`
    ALTER TABLE contrataciones_web
    ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;
  `);

  await pool.query(`
    ALTER TABLE contrataciones_web
    ADD COLUMN IF NOT EXISTS telefono VARCHAR(80),
    ADD COLUMN IF NOT EXISTS rut VARCHAR(40),
    ADD COLUMN IF NOT EXISTS empresa VARCHAR(220),
    ADD COLUMN IF NOT EXISTS periodicidad VARCHAR(30) NOT NULL DEFAULT 'mensual',
    ADD COLUMN IF NOT EXISTS monto_neto INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS iva INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS total INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS estado VARCHAR(60) NOT NULL DEFAULT 'pendiente',
    ADD COLUMN IF NOT EXISTS mp_preference_id VARCHAR(160),
    ADD COLUMN IF NOT EXISTS mp_payment_id VARCHAR(160),
    ADD COLUMN IF NOT EXISTS mp_status VARCHAR(80),
    ADD COLUMN IF NOT EXISTS mp_status_detail VARCHAR(160),
    ADD COLUMN IF NOT EXISTS origen VARCHAR(80) DEFAULT 'web',
    ADD COLUMN IF NOT EXISTS creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ADD COLUMN IF NOT EXISTS actualizado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
  `);
}

function mapearEstadoPago(status) {
  if (status === "approved") return "activo";
  if (status === "rejected" || status === "cancelled") return "rechazado";
  if (status === "refunded" || status === "charged_back") return "reversado";
  return "pendiente";
}

async function crearPreferenciaContratacion(req, res) {
  try {
    await asegurarTablaContrataciones();

    const nombre = limpiarTexto(req.body.nombre);
    const correo = limpiarTexto(req.body.correo || req.body.email).toLowerCase();
    const telefono = limpiarTexto(req.body.telefono);
    const rut = limpiarTexto(req.body.rut);
    const empresa = limpiarTexto(req.body.empresa);
    const periodicidad = limpiarTexto(req.body.periodicidad || "mensual").toLowerCase();
    const usuariosAdicionales = normalizarEnteroPositivo(
      req.body.usuarios_adicionales || req.body.usuariosAdicionales
    );
    const aceptaTerminos = Boolean(req.body.acepta_terminos || req.body.aceptaTerminos);

    if (!nombre || !correo) {
      return res.status(400).json({
        ok: false,
        error: "Nombre y correo son obligatorios para contratar.",
      });
    }

    if (!validarCorreo(correo)) {
      return res.status(400).json({
        ok: false,
        error: "El correo ingresado no es valido.",
      });
    }

    if (!PLANES[periodicidad]) {
      return res.status(400).json({
        ok: false,
        error: "Periodicidad no valida.",
      });
    }

    if (!aceptaTerminos) {
      return res.status(400).json({
        ok: false,
        error: "Debes aceptar las condiciones de contratacion antes de pagar.",
      });
    }

    const accessToken = limpiarTexto(process.env.MP_ACCESS_TOKEN);

    if (!accessToken) {
      return res.status(500).json({
        ok: false,
        error: "MP_ACCESS_TOKEN no esta configurado en el backend.",
      });
    }

    const totales = calcularTotales(periodicidad, usuariosAdicionales);

    const contratacionResult = await pool.query(
      `
      INSERT INTO contrataciones_web
      (nombre, correo, telefono, rut, empresa, periodicidad, monto_neto, iva, total, estado, metadata)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'pendiente_pago', $10)
      RETURNING *;
      `,
      [
        nombre,
        correo,
        telefono,
        rut,
        empresa,
        periodicidad,
        totales.montoNeto,
        totales.iva,
        totales.total,
        JSON.stringify({
          acepta_terminos: true,
          plan: "PRO multiempresa 1 usuario",
          usuarios_adicionales: usuariosAdicionales,
          meses_cobrados: totales.mesesCobrados,
          plan_base_neto: totales.planBaseNeto,
          usuarios_adicionales_neto: totales.usuariosAdicionalesNeto,
          subtotal_neto: totales.montoNeto,
          mensaje: limpiarTexto(req.body.mensaje),
        }),
      ]
    );

    const contratacion = contratacionResult.rows[0];
    const frontendBase = obtenerBaseFrontend();

    const preferenceBody = {
      items: [
        {
          id: `servcontable-pro-${periodicidad}`,
          title: totales.nombre,
          description:
            periodicidad === "anual"
              ? `Plan multiempresa anual con 1 usuario incluido${
                  usuariosAdicionales
                    ? ` y ${usuariosAdicionales} usuario(s) adicional(es)`
                    : ""
                }`
              : `Plan multiempresa mensual con 1 usuario incluido${
                  usuariosAdicionales
                    ? ` y ${usuariosAdicionales} usuario(s) adicional(es)`
                    : ""
                }`,
          quantity: 1,
          currency_id: "CLP",
          unit_price: totales.total,
        },
      ],
      payer: {
        name: nombre,
        email: correo,
        phone: telefono ? { number: telefono } : undefined,
      },
      back_urls: {
        success: `${frontendBase}/pago-exitoso?contratacion=${contratacion.id}`,
        pending: `${frontendBase}/pago-pendiente?contratacion=${contratacion.id}`,
        failure: `${frontendBase}/pago-error?contratacion=${contratacion.id}`,
      },
      auto_return: "approved",
      external_reference: String(contratacion.id),
      notification_url: obtenerWebhookUrl(),
      statement_descriptor: "SERVCONTABLE",
      metadata: {
        contratacion_id: contratacion.id,
        periodicidad,
        correo,
        empresa,
        usuarios_adicionales: usuariosAdicionales,
        monto_neto: totales.montoNeto,
        iva: totales.iva,
        total: totales.total,
      },
    };

    const respuesta = await fetch(
      "https://api.mercadopago.com/checkout/preferences",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(preferenceBody),
      }
    );

    const dataMercadoPago = await respuesta.json();

    if (!respuesta.ok) {
      console.error("Error Mercado Pago preferencia:", dataMercadoPago);

      await pool.query(
        `
        UPDATE contrataciones_web
        SET estado = 'error_preferencia', metadata = metadata || $1::jsonb, actualizado_en = CURRENT_TIMESTAMP
        WHERE id = $2;
        `,
        [JSON.stringify({ mp_error: dataMercadoPago }), contratacion.id]
      );

      return res.status(502).json({
        ok: false,
        error: "Mercado Pago no pudo crear el link de pago.",
        detalle: dataMercadoPago.message || dataMercadoPago.error || null,
      });
    }

    await pool.query(
      `
      UPDATE contrataciones_web
      SET mp_preference_id = $1, actualizado_en = CURRENT_TIMESTAMP
      WHERE id = $2;
      `,
      [dataMercadoPago.id, contratacion.id]
    );

    return res.status(201).json({
      ok: true,
      mensaje: "Link de pago creado correctamente.",
      contratacion_id: contratacion.id,
      preference_id: dataMercadoPago.id,
      init_point: dataMercadoPago.init_point,
      sandbox_init_point: dataMercadoPago.sandbox_init_point,
      total: totales.total,
      monto_neto: totales.montoNeto,
      iva: totales.iva,
      usuarios_adicionales: usuariosAdicionales,
      usuarios_adicionales_neto: totales.usuariosAdicionalesNeto,
      plan_base_neto: totales.planBaseNeto,
      meses_cobrados: totales.mesesCobrados,
    });
  } catch (error) {
    console.error("Error al crear preferencia Mercado Pago:", error);

    return res.status(500).json({
      ok: false,
      error: "No se pudo iniciar la contratacion.",
    });
  }
}

async function obtenerContratacion(req, res) {
  try {
    await asegurarTablaContrataciones();

    const resultado = await pool.query(
      `
      SELECT id, nombre, correo, empresa, periodicidad, monto_neto, iva, total,
             estado, mp_status, mp_status_detail, creado_en, actualizado_en
      FROM contrataciones_web
      WHERE id = $1;
      `,
      [req.params.id]
    );

    if (resultado.rowCount === 0) {
      return res.status(404).json({ ok: false, error: "Contratacion no encontrada." });
    }

    return res.json({ ok: true, contratacion: resultado.rows[0] });
  } catch (error) {
    console.error("Error al obtener contratacion:", error);

    return res.status(500).json({
      ok: false,
      error: "No se pudo obtener la contratacion.",
    });
  }
}

function obtenerResumenPagoMercadoPago(metadata = {}) {
  const pago = metadata?.pago_mercado_pago || null;

  if (!pago) {
    return null;
  }

  return {
    id: pago.id || null,
    estado: pago.status || null,
    detalle_estado: pago.status_detail || null,
    fecha_creacion: pago.date_created || null,
    fecha_aprobacion: pago.date_approved || null,
    medio_pago: pago.payment_method_id || null,
    tipo_pago: pago.payment_type_id || null,
    cuotas: pago.installments || null,
    monto: pago.transaction_amount || null,
    monto_recibido: pago.transaction_details?.net_received_amount || null,
    referencia: pago.external_reference || null,
    pagador: {
      correo: pago.payer?.email || null,
      nombre: pago.payer?.first_name || null,
      apellido: pago.payer?.last_name || null,
      identificacion_tipo: pago.payer?.identification?.type || null,
      identificacion_numero: pago.payer?.identification?.number || null,
    },
  };
}

async function listarContratacionesWeb(req, res) {
  try {
    await asegurarTablaContrataciones();

    const resultado = await pool.query(`
      SELECT
        id,
        nombre,
        correo,
        telefono,
        rut,
        empresa,
        periodicidad,
        monto_neto,
        iva,
        total,
        estado,
        mp_preference_id,
        mp_payment_id,
        mp_status,
        mp_status_detail,
        origen,
        metadata,
        creado_en,
        actualizado_en
      FROM contrataciones_web
      ORDER BY creado_en DESC
      LIMIT 300;
    `);

    const solicitudes = resultado.rows.map((item) => {
      const metadata = item.metadata || {};

      return {
        ...item,
        gestion: metadata.gestion || null,
        pago_mercado_pago: obtenerResumenPagoMercadoPago(metadata),
      };
    });

    return res.json({ ok: true, solicitudes });
  } catch (error) {
    console.error("Error al listar contrataciones web:", error);

    return res.status(500).json({
      ok: false,
      error: "No se pudieron obtener las solicitudes web.",
    });
  }
}

async function actualizarGestionContratacion(req, res) {
  try {
    await asegurarTablaContrataciones();

    const estadoGestion = limpiarTexto(req.body?.estado_gestion || "contactado");

    const metadataGestion = {
      gestion: {
        estado: estadoGestion,
        usuario_id: req.usuario?.id || null,
        usuario: req.usuario?.email || req.usuario?.nombre || null,
        actualizado_en: new Date().toISOString(),
      },
    };

    const resultado = await pool.query(
      `
      UPDATE contrataciones_web
      SET metadata = metadata || $1::jsonb,
          actualizado_en = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING id, metadata;
      `,
      [JSON.stringify(metadataGestion), req.params.id]
    );

    if (resultado.rowCount === 0) {
      return res.status(404).json({
        ok: false,
        error: "Solicitud web no encontrada.",
      });
    }

    return res.json({
      ok: true,
      mensaje: "Solicitud web actualizada correctamente.",
      gestion: resultado.rows[0].metadata?.gestion || null,
    });
  } catch (error) {
    console.error("Error al actualizar solicitud web:", error);

    return res.status(500).json({
      ok: false,
      error: "No se pudo actualizar la solicitud web.",
    });
  }
}

async function recibirWebhookMercadoPago(req, res) {
  try {
    await asegurarTablaContrataciones();

    const accessToken = limpiarTexto(process.env.MP_ACCESS_TOKEN);
    const tipo = limpiarTexto(req.query.type || req.body.type || req.body.topic);
    const paymentId = limpiarTexto(
      req.query.id ||
        req.query["data.id"] ||
        req.body?.data?.id ||
        req.body?.id
    );

    if (!paymentId || !accessToken || (tipo && tipo !== "payment")) {
      return res.status(200).json({ ok: true, recibido: true });
    }

    const respuestaPago = await fetch(
      `https://api.mercadopago.com/v1/payments/${paymentId}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    const pago = await respuestaPago.json();

    if (!respuestaPago.ok) {
      console.error("Error consultando pago Mercado Pago:", pago);
      return res.status(200).json({ ok: true, recibido: true });
    }

    const contratacionId = limpiarTexto(
      pago.external_reference || pago.metadata?.contratacion_id
    );

    if (!contratacionId) {
      return res.status(200).json({ ok: true, recibido: true });
    }

    await pool.query(
      `
      UPDATE contrataciones_web
      SET
        estado = $1,
        mp_payment_id = $2,
        mp_status = $3,
        mp_status_detail = $4,
        metadata = metadata || $5::jsonb,
        actualizado_en = CURRENT_TIMESTAMP
      WHERE id = $6;
      `,
      [
        mapearEstadoPago(pago.status),
        String(paymentId),
        pago.status || null,
        pago.status_detail || null,
        JSON.stringify({ pago_mercado_pago: pago }),
        contratacionId,
      ]
    );

    return res.status(200).json({ ok: true, recibido: true });
  } catch (error) {
    console.error("Error webhook Mercado Pago:", error);

    return res.status(200).json({ ok: true, recibido: true });
  }
}

module.exports = {
  crearPreferenciaContratacion,
  obtenerContratacion,
  listarContratacionesWeb,
  actualizarGestionContratacion,
  recibirWebhookMercadoPago,
};
