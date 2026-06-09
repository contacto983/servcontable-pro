const crypto = require("crypto");
const pool = require("../database/db");
const {
  crearPreferenceClient,
  crearPaymentClient,
} = require("../helpers/mercadoPago.helper");
const {
  asegurarEsquemaSuscripcion,
  extenderSuscripcionUsuario,
} = require("../helpers/suscripcion.helper");

const PRECIO_MENSUAL_BASE = 16990;
const PRECIO_ANUAL_BASE_MENSUAL = 14990;
const PRECIO_USUARIO_ADICIONAL_MENSUAL = 3990;
const MESES_ANUAL = 12;
const IVA = 0.19;

async function asegurarTablaPagosMercadoPago() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS pagos_mercadopago (
      id SERIAL PRIMARY KEY,
      external_reference VARCHAR(120) UNIQUE NOT NULL,
      preference_id VARCHAR(200),
      mp_payment_id VARCHAR(200),
      usuario_id INTEGER,
      tipo_operacion VARCHAR(50) DEFAULT 'contratacion',
      estado VARCHAR(80) DEFAULT 'pendiente',
      estado_plan VARCHAR(80) DEFAULT 'pendiente',
      estado_detalle VARCHAR(150),
      plan VARCHAR(80),
      nombre VARCHAR(200),
      correo VARCHAR(200),
      empresa VARCHAR(200),
      rut VARCHAR(40),
      telefono VARCHAR(80),
      mensaje TEXT,
      monto NUMERIC(14, 2),
      subtotal_neto NUMERIC(14, 2),
      iva NUMERIC(14, 2),
      usuarios_adicionales INTEGER DEFAULT 0,
      meses_cobrados INTEGER DEFAULT 1,
      moneda VARCHAR(10) DEFAULT 'CLP',
      init_point TEXT,
      raw_response JSONB,
      creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      actualizado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  await pool.query(`
    ALTER TABLE pagos_mercadopago
      ADD COLUMN IF NOT EXISTS usuario_id INTEGER,
      ADD COLUMN IF NOT EXISTS tipo_operacion VARCHAR(50) DEFAULT 'contratacion',
      ADD COLUMN IF NOT EXISTS estado_plan VARCHAR(80) DEFAULT 'pendiente',
      ADD COLUMN IF NOT EXISTS rut VARCHAR(40),
      ADD COLUMN IF NOT EXISTS telefono VARCHAR(80),
      ADD COLUMN IF NOT EXISTS mensaje TEXT,
      ADD COLUMN IF NOT EXISTS subtotal_neto NUMERIC(14, 2),
      ADD COLUMN IF NOT EXISTS iva NUMERIC(14, 2),
      ADD COLUMN IF NOT EXISTS usuarios_adicionales INTEGER DEFAULT 0,
      ADD COLUMN IF NOT EXISTS meses_cobrados INTEGER DEFAULT 1,
      ADD COLUMN IF NOT EXISTS init_point TEXT,
      ADD COLUMN IF NOT EXISTS raw_response JSONB,
      ADD COLUMN IF NOT EXISTS mp_payment_id VARCHAR(200),
      ADD COLUMN IF NOT EXISTS estado_detalle VARCHAR(150);
  `);
}

function limpiarTexto(valor) {
  if (valor === undefined || valor === null) return "";
  return String(valor).trim();
}

function normalizarEntero(valor, fallback = 0) {
  const numero = Number(valor);
  if (!Number.isFinite(numero)) return fallback;
  return Math.max(0, Math.floor(numero));
}

function normalizarBooleano(valor) {
  if (valor === true) return true;
  const texto = limpiarTexto(valor).toLowerCase();
  return ["true", "1", "si", "sí", "s", "on", "acepto"].includes(texto);
}

function limpiarUrlBase(url) {
  return limpiarTexto(url).replace(/\/+$/, "");
}

function obtenerPlan(datos = {}) {
  const modalidad = limpiarTexto(datos.plan || datos.periodicidad || datos.modalidad)
    .toLowerCase() === "anual"
    ? "anual"
    : "mensual";

  const usuariosAdicionales = normalizarEntero(
    datos.usuarios_adicionales || datos.usuariosAdicionales,
    0
  );

  const mesesSolicitados = normalizarEntero(datos.meses || datos.meses_cobrados, 1);
  const mesesCobrados =
    modalidad === "anual" ? MESES_ANUAL : Math.min(Math.max(mesesSolicitados, 1), 12);

  const planBaseNeto =
    modalidad === "anual"
      ? PRECIO_ANUAL_BASE_MENSUAL * MESES_ANUAL
      : PRECIO_MENSUAL_BASE * mesesCobrados;

  const usuariosAdicionalesNeto =
    PRECIO_USUARIO_ADICIONAL_MENSUAL * usuariosAdicionales * mesesCobrados;

  const subtotalNeto = planBaseNeto + usuariosAdicionalesNeto;
  const iva = Math.round(subtotalNeto * IVA);
  const total = subtotalNeto + iva;

  return {
    codigo: modalidad,
    titulo:
      modalidad === "anual"
        ? "ServContable PRO - Plan anual"
        : "ServContable PRO - Renovación mensual",
    precio: total,
    plan_base_neto: planBaseNeto,
    usuarios_adicionales_neto: usuariosAdicionalesNeto,
    subtotal_neto: subtotalNeto,
    iva,
    usuarios_adicionales: usuariosAdicionales,
    meses_cobrados: mesesCobrados,
  };
}

function crearItemsMercadoPago(plan) {
  const items = [
    {
      title:
        plan.codigo === "anual"
          ? "ServContable PRO - Plan anual base"
          : "ServContable PRO - Plan mensual base",
      description:
        plan.codigo === "anual"
          ? "12 meses x $14.990 neto"
          : `${plan.meses_cobrados} mes(es) x $16.990 neto`,
      quantity: 1,
      unit_price: plan.plan_base_neto,
      currency_id: "CLP",
    },
  ];

  if (plan.usuarios_adicionales > 0 && plan.usuarios_adicionales_neto > 0) {
    items.push({
      title: `Usuarios adicionales (${plan.usuarios_adicionales})`,
      description: `${plan.usuarios_adicionales} usuario(s) x ${plan.meses_cobrados} mes(es) x $3.990 neto`,
      quantity: 1,
      unit_price: plan.usuarios_adicionales_neto,
      currency_id: "CLP",
    });
  }

  items.push({
    title: "IVA 19%",
    description: "Impuesto calculado sobre el neto",
    quantity: 1,
    unit_price: plan.iva,
    currency_id: "CLP",
  });

  return items;
}

function construirRawResponseAnterior(rawResponse) {
  if (!rawResponse) return null;
  if (rawResponse.payment || rawResponse.preference) {
    return rawResponse.preference || rawResponse;
  }
  return rawResponse;
}

async function crearCheckoutMercadoPago(req, res) {
  try {
    await asegurarTablaPagosMercadoPago();

    const nombre = limpiarTexto(req.body.nombre);
    const correo = limpiarTexto(req.body.correo || req.body.email);
    const empresa = limpiarTexto(req.body.empresa);
    const rut = limpiarTexto(req.body.rut);
    const telefono = limpiarTexto(req.body.telefono);
    const mensaje = limpiarTexto(req.body.mensaje);
    const aceptaTerminos = normalizarBooleano(
      req.body.acepta_terminos || req.body.aceptaTerminos
    );
    const plan = obtenerPlan(req.body);

    if (!nombre || !correo) {
      return res.status(400).json({
        ok: false,
        error: "Nombre y correo son obligatorios para iniciar el pago.",
      });
    }

    if (!aceptaTerminos) {
      return res.status(400).json({
        ok: false,
        error: "Debes aceptar las condiciones antes de iniciar el pago.",
      });
    }

    const publicBaseUrl = limpiarUrlBase(
      process.env.PUBLIC_BASE_URL || "https://servcontablepro.cl"
    );

    const webhookUrl = limpiarTexto(
      process.env.MP_WEBHOOK_URL ||
        "https://api.servcontablepro.cl/api/pagos-mercadopago/webhook"
    );

    const externalReference = crypto.randomUUID();
    const contratacionQuery = `contratacion=${encodeURIComponent(externalReference)}`;

    const preferenceClient = crearPreferenceClient();

    const preferenceBody = {
      items: crearItemsMercadoPago(plan),
      payer: {
        name: nombre,
        email: correo,
      },
      back_urls: {
        success: `${publicBaseUrl}/pago-exitoso.html?${contratacionQuery}`,
        failure: `${publicBaseUrl}/pago-error.html?${contratacionQuery}`,
        pending: `${publicBaseUrl}/pago-pendiente.html?${contratacionQuery}`,
      },
      auto_return: "approved",
      notification_url: webhookUrl,
      external_reference: externalReference,
      metadata: {
        tipo_operacion: "contratacion",
        nombre,
        correo,
        empresa,
        rut,
        telefono,
        plan: plan.codigo,
        usuarios_adicionales: plan.usuarios_adicionales,
        meses_cobrados: plan.meses_cobrados,
        subtotal_neto: plan.subtotal_neto,
        iva: plan.iva,
        total: plan.precio,
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
        tipo_operacion,
        estado,
        estado_plan,
        plan,
        nombre,
        correo,
        empresa,
        rut,
        telefono,
        mensaje,
        monto,
        subtotal_neto,
        iva,
        usuarios_adicionales,
        meses_cobrados,
        moneda,
        init_point,
        raw_response
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20)
      `,
      [
        externalReference,
        preference.id,
        "contratacion",
        "pendiente",
        "pendiente",
        plan.codigo,
        nombre,
        correo,
        empresa,
        rut,
        telefono,
        mensaje,
        plan.precio,
        plan.subtotal_neto,
        plan.iva,
        plan.usuarios_adicionales,
        plan.meses_cobrados,
        "CLP",
        preference.init_point,
        JSON.stringify(preference),
      ]
    );

    return res.json({
      ok: true,
      contratacion_id: externalReference,
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

async function crearRenovacionMercadoPago(req, res) {
  try {
    if (req.usuario?.demo) {
      return res.status(403).json({
        ok: false,
        error: "La versión demo no permite renovar suscripciones.",
      });
    }

    await asegurarTablaPagosMercadoPago();
    await asegurarEsquemaSuscripcion(pool);

    const usuarioResult = await pool.query(
      `
      SELECT
        u.id,
        u.nombre,
        u.email,
        u.suscripcion_estado,
        u.suscripcion_plan,
        u.suscripcion_vence,
        e.razon_social AS empresa,
        e.rut
      FROM usuarios u
      LEFT JOIN usuarios_empresas ue ON ue.usuario_id = u.id AND ue.activo = true
      LEFT JOIN empresas e ON e.id = ue.empresa_id
      WHERE u.id = $1 AND u.activo = true
      ORDER BY e.id ASC
      LIMIT 1
      `,
      [req.usuario.id]
    );

    if (usuarioResult.rowCount === 0) {
      return res.status(404).json({
        ok: false,
        error: "Usuario no encontrado.",
      });
    }

    const usuario = usuarioResult.rows[0];
    const plan = obtenerPlan(req.body);
    const externalReference = crypto.randomUUID();
    const appBaseUrl = limpiarUrlBase(
      process.env.APP_BASE_URL ||
        process.env.FRONTEND_APP_URL ||
        process.env.FRONTEND_URL ||
        req.headers.origin ||
        "https://app.servcontablepro.cl"
    );
    const webhookUrl = limpiarTexto(
      process.env.MP_WEBHOOK_URL ||
        "https://api.servcontablepro.cl/api/pagos-mercadopago/webhook"
    );
    const query = `renovacion=${encodeURIComponent(externalReference)}`;

    const preferenceClient = crearPreferenceClient();
    const preference = await preferenceClient.create({
      body: {
        items: crearItemsMercadoPago(plan),
        payer: {
          name: usuario.nombre,
          email: usuario.email,
        },
        back_urls: {
          success: `${appBaseUrl}/?${query}&resultado=exitoso`,
          failure: `${appBaseUrl}/?${query}&resultado=error`,
          pending: `${appBaseUrl}/?${query}&resultado=pendiente`,
        },
        auto_return: "approved",
        notification_url: webhookUrl,
        external_reference: externalReference,
        metadata: {
          tipo_operacion: "renovacion",
          usuario_id: usuario.id,
          correo: usuario.email,
          plan: plan.codigo,
          usuarios_adicionales: plan.usuarios_adicionales,
          meses_cobrados: plan.meses_cobrados,
          subtotal_neto: plan.subtotal_neto,
          iva: plan.iva,
          total: plan.precio,
        },
      },
    });

    await pool.query(
      `
      INSERT INTO pagos_mercadopago
      (
        external_reference,
        preference_id,
        usuario_id,
        tipo_operacion,
        estado,
        estado_plan,
        plan,
        nombre,
        correo,
        empresa,
        rut,
        mensaje,
        monto,
        subtotal_neto,
        iva,
        usuarios_adicionales,
        meses_cobrados,
        moneda,
        init_point,
        raw_response
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20)
      `,
      [
        externalReference,
        preference.id,
        usuario.id,
        "renovacion",
        "pendiente",
        "pendiente",
        plan.codigo,
        usuario.nombre,
        usuario.email,
        usuario.empresa || "",
        usuario.rut || "",
        "Renovación de suscripción desde la aplicación",
        plan.precio,
        plan.subtotal_neto,
        plan.iva,
        plan.usuarios_adicionales,
        plan.meses_cobrados,
        "CLP",
        preference.init_point,
        JSON.stringify(preference),
      ]
    );

    return res.json({
      ok: true,
      renovacion_id: externalReference,
      preference_id: preference.id,
      init_point: preference.init_point,
      sandbox_init_point: preference.sandbox_init_point,
      external_reference: externalReference,
      total: plan.precio,
    });
  } catch (error) {
    console.error("Error al crear renovación Mercado Pago:", error);

    return res.status(500).json({
      ok: false,
      error: "No se pudo iniciar la renovación con Mercado Pago.",
    });
  }
}

async function webhookMercadoPago(req, res) {
  try {
    await asegurarTablaPagosMercadoPago();
    await asegurarEsquemaSuscripcion(pool);

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

    const registroResult = await pool.query(
      `
      SELECT *
      FROM pagos_mercadopago
      WHERE external_reference = $1
      LIMIT 1
      `,
      [externalReference]
    );
    const registro = registroResult.rows[0] || null;
    const yaAprobado = registro?.estado === "approved" && registro?.estado_plan === "activo";
    const estadoPlan =
      estado === "approved"
        ? registro?.usuario_id
          ? "activo"
          : "pagado"
        : "pendiente";
    const rawAnterior = construirRawResponseAnterior(registro?.raw_response);
    const rawResponse = {
      payment: pago,
      preference: rawAnterior,
    };

    if (estado === "approved" && registro?.usuario_id && !yaAprobado) {
      const client = await pool.connect();

      try {
        await client.query("BEGIN");
        await extenderSuscripcionUsuario(
          client,
          registro.usuario_id,
          registro.meses_cobrados,
          registro.plan,
          registro.usuarios_adicionales,
          externalReference
        );
        await client.query(
          `
          UPDATE pagos_mercadopago
          SET
            mp_payment_id = $1,
            estado = $2,
            estado_plan = $3,
            estado_detalle = $4,
            raw_response = $5::jsonb,
            actualizado_en = CURRENT_TIMESTAMP
          WHERE external_reference = $6
          `,
          [
            String(paymentId),
            estado,
            estadoPlan,
            estadoDetalle,
            JSON.stringify(rawResponse),
            externalReference,
          ]
        );
        await client.query("COMMIT");
      } catch (error) {
        await client.query("ROLLBACK");
        throw error;
      } finally {
        client.release();
      }
    } else {
      await pool.query(
        `
        UPDATE pagos_mercadopago
        SET
          mp_payment_id = $1,
          estado = $2,
          estado_plan = $3,
          estado_detalle = $4,
          raw_response = $5::jsonb,
          actualizado_en = CURRENT_TIMESTAMP
        WHERE external_reference = $6
        `,
        [
          String(paymentId),
          estado,
          estadoPlan,
          estadoDetalle,
          JSON.stringify(rawResponse),
          externalReference,
        ]
      );
    }

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

async function obtenerEstadoContratacionMercadoPago(req, res) {
  try {
    await asegurarTablaPagosMercadoPago();

    const identificador = limpiarTexto(req.params.id);

    if (!identificador) {
      return res.status(400).json({
        ok: false,
        error: "Identificador de contratación requerido.",
      });
    }

    const resultado = await pool.query(
      `
      SELECT
        id,
        external_reference,
        preference_id,
        mp_payment_id,
        usuario_id,
        tipo_operacion,
        estado,
        estado_plan,
        estado_detalle,
        plan,
        nombre,
        correo,
        empresa,
        rut,
        telefono,
        mensaje,
        monto,
        subtotal_neto,
        iva,
        usuarios_adicionales,
        meses_cobrados,
        moneda,
        init_point,
        raw_response,
        creado_en,
        actualizado_en
      FROM pagos_mercadopago
      WHERE external_reference = $1
        OR preference_id = $1
        OR id::text = $1
      LIMIT 1
      `,
      [identificador]
    );

    if (resultado.rowCount === 0) {
      return res.status(404).json({
        ok: false,
        error: "No se encontró la contratación.",
      });
    }

    return res.json({
      ok: true,
      contratacion: resultado.rows[0],
    });
  } catch (error) {
    console.error("Error al obtener estado Mercado Pago:", error);

    return res.status(500).json({
      ok: false,
      error: "No se pudo obtener el estado de la contratación.",
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
        usuario_id,
        tipo_operacion,
        estado,
        estado_plan,
        estado_detalle,
        plan,
        nombre,
        correo,
        empresa,
        rut,
        telefono,
        mensaje,
        monto,
        subtotal_neto,
        iva,
        usuarios_adicionales,
        meses_cobrados,
        moneda,
        init_point,
        raw_response,
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
  crearRenovacionMercadoPago,
  webhookMercadoPago,
  obtenerEstadoContratacionMercadoPago,
  listarPagosMercadoPago,
};
