const crypto = require("crypto");
const pool = require("../database/db");
const {
  crearPreferenceClient,
  crearPaymentClient,
} = require("../helpers/mercadoPago.helper");

async function asegurarTablaPagosMercadoPago() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS pagos_mercadopago (
      id SERIAL PRIMARY KEY,
      external_reference VARCHAR(120) UNIQUE NOT NULL,
      preference_id VARCHAR(200),
      mp_payment_id VARCHAR(200),
      estado VARCHAR(80) DEFAULT 'pendiente',
      estado_detalle VARCHAR(150),
      plan VARCHAR(80),
      nombre VARCHAR(200),
      correo VARCHAR(200),
      empresa VARCHAR(200),
      monto NUMERIC(14, 2),
      moneda VARCHAR(10) DEFAULT 'CLP',
      init_point TEXT,
      raw_response JSONB,
      creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      actualizado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);
}

function limpiarTexto(valor) {
  if (valor === undefined || valor === null) return "";
  return String(valor).trim();
}

function obtenerPlan(planRecibido) {
  const plan = limpiarTexto(planRecibido).toLowerCase();

  if (plan === "anual") {
    return {
      codigo: "anual",
      titulo: "ServContable PRO - Plan anual",
      precio: 99000,
    };
  }

  return {
    codigo: "mensual",
    titulo: "ServContable PRO - Plan mensual",
    precio: 9900,
  };
}

async function crearCheckoutMercadoPago(req, res) {
  try {
    await asegurarTablaPagosMercadoPago();

    const nombre = limpiarTexto(req.body.nombre);
    const correo = limpiarTexto(req.body.correo || req.body.email);
    const empresa = limpiarTexto(req.body.empresa);
    const plan = obtenerPlan(req.body.plan || req.body.interes || "mensual");

    if (!nombre || !correo) {
      return res.status(400).json({
        ok: false,
        error: "Nombre y correo son obligatorios para iniciar el pago.",
      });
    }

    const publicBaseUrl =
      process.env.PUBLIC_BASE_URL || "https://servcontablepro.cl";

    const webhookUrl =
      process.env.MP_WEBHOOK_URL ||
      "https://api.servcontablepro.cl/api/pagos-mercadopago/webhook";

    const externalReference = crypto.randomUUID();

    const preferenceClient = crearPreferenceClient();

    const preferenceBody = {
      items: [
        {
          title: plan.titulo,
          quantity: 1,
          unit_price: plan.precio,
          currency_id: "CLP",
        },
      ],
      payer: {
        name: nombre,
        email: correo,
      },
      back_urls: {
        success: `${publicBaseUrl}/pago-exitoso.html`,
        failure: `${publicBaseUrl}/pago-error.html`,
        pending: `${publicBaseUrl}/pago-pendiente.html`,
      },
      auto_return: "approved",
      notification_url: webhookUrl,
      external_reference: externalReference,
      metadata: {
        nombre,
        correo,
        empresa,
        plan: plan.codigo,
      },
    };

    const preference = await preferenceClient.create({
      body: preferenceBody,
    });

    await pool.query(
      `
      INSERT INTO pagos_mercadopago
      (
        external_reference,
        preference_id,
        estado,
        plan,
        nombre,
        correo,
        empresa,
        monto,
        moneda,
        init_point,
        raw_response
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
      `,
      [
        externalReference,
        preference.id,
        "pendiente",
        plan.codigo,
        nombre,
        correo,
        empresa,
        plan.precio,
        "CLP",
        preference.init_point,
        JSON.stringify(preference),
      ]
    );

    return res.json({
      ok: true,
      preference_id: preference.id,
      init_point: preference.init_point,
      sandbox_init_point: preference.sandbox_init_point,
      external_reference: externalReference,
    });
  } catch (error) {
    console.error("Error al crear checkout Mercado Pago:", error);

    return res.status(500).json({
      ok: false,
      error: "No se pudo iniciar el pago con Mercado Pago.",
    });
  }
}

async function webhookMercadoPago(req, res) {
  try {
    await asegurarTablaPagosMercadoPago();

    const tipo = req.body?.type || req.query?.type || req.query?.topic;
    const paymentId =
      req.body?.data?.id ||
      req.query?.["data.id"] ||
      req.query?.id ||
      req.body?.id;

    console.log("Webhook Mercado Pago recibido:", {
      tipo,
      paymentId,
      body: req.body,
      query: req.query,
    });

    if (!paymentId) {
      return res.status(200).json({
        ok: true,
        mensaje: "Webhook recibido sin paymentId.",
      });
    }

    const paymentClient = crearPaymentClient();
    const pago = await paymentClient.get({
      id: paymentId,
    });

    const externalReference = pago.external_reference;
    const estado = pago.status || "desconocido";
    const estadoDetalle = pago.status_detail || "";

    await pool.query(
      `
      UPDATE pagos_mercadopago
      SET
        mp_payment_id = $1,
        estado = $2,
        estado_detalle = $3,
        raw_response = $4,
        actualizado_en = CURRENT_TIMESTAMP
      WHERE external_reference = $5
      `,
      [
        String(paymentId),
        estado,
        estadoDetalle,
        JSON.stringify(pago),
        externalReference,
      ]
    );

    return res.status(200).json({
      ok: true,
      mensaje: "Webhook procesado.",
    });
  } catch (error) {
    console.error("Error procesando webhook Mercado Pago:", error);

    return res.status(200).json({
      ok: false,
      error: "Webhook recibido, pero no se pudo procesar.",
    });
  }
}

async function listarPagosMercadoPago(req, res) {
  try {
    await asegurarTablaPagosMercadoPago();

    const resultado = await pool.query(`
      SELECT
        id,
        external_reference,
        preference_id,
        mp_payment_id,
        estado,
        estado_detalle,
        plan,
        nombre,
        correo,
        empresa,
        monto,
        moneda,
        creado_en,
        actualizado_en
      FROM pagos_mercadopago
      ORDER BY creado_en DESC
      LIMIT 100
    `);

    return res.json({
      ok: true,
      pagos: resultado.rows,
    });
  } catch (error) {
    console.error("Error al listar pagos Mercado Pago:", error);

    return res.status(500).json({
      ok: false,
      error: "No se pudieron obtener los pagos.",
    });
  }
}

module.exports = {
  crearCheckoutMercadoPago,
  webhookMercadoPago,
  listarPagosMercadoPago,
};