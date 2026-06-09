import { Fragment, useEffect, useMemo, useState } from "react";
import {
  listarSolicitudesContacto,
  actualizarSolicitudContacto,
  listarPagosMercadoPago,
} from "../services/solicitudesContactoService";

export default function SolicitudesWeb({ volverAlPanel }) {
  const [solicitudes, setSolicitudes] = useState([]);
  const [pagos, setPagos] = useState([]);
  const [pagoExpandido, setPagoExpandido] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  async function cargarDatos() {
    try {
      setCargando(true);
      setError("");

      const [solicitudesData, pagosData] = await Promise.all([
        listarSolicitudesContacto(),
        listarPagosMercadoPago(),
      ]);

      setSolicitudes(solicitudesData);
      setPagos(pagosData);
    } catch (err) {
      setError(err.message || "Error al cargar solicitudes y pagos.");
    } finally {
      setCargando(false);
    }
  }

  async function marcarContactado(id) {
    try {
      await actualizarSolicitudContacto(id, {
        estado: "contactado",
      });

      await cargarDatos();
    } catch (err) {
      alert(err.message || "No se pudo actualizar la solicitud.");
    }
  }

  const resumen = useMemo(() => {
    const pagosAprobados = pagos.filter((pago) => esPagoAprobado(pago));
    const pagosPendientes = pagos.filter((pago) => !esPagoAprobado(pago));
    const totalAprobado = pagosAprobados.reduce(
      (total, pago) => total + numero(pago.monto),
      0
    );

    return {
      solicitudes: solicitudes.length,
      pagos: pagos.length,
      aprobados: pagosAprobados.length,
      pendientes: pagosPendientes.length,
      totalAprobado,
    };
  }, [solicitudes, pagos]);

  useEffect(() => {
    cargarDatos();
  }, []);

  return (
    <div style={contenedor}>
      <div style={cabecera}>
        <div>
          <h1 style={titulo}>Solicitudes Web</h1>
          <p style={subtitulo}>
            Solicitudes del formulario y detalle de pagos Mercado Pago.
          </p>
        </div>

        <div style={accionesCabecera}>
          <button style={botonActualizar} onClick={cargarDatos}>
            Actualizar
          </button>

          <button style={botonVolver} onClick={volverAlPanel}>
            Volver al panel
          </button>
        </div>
      </div>

      <div style={resumenGrid}>
        <ResumenCard titulo="Solicitudes" valor={resumen.solicitudes} detalle="Formulario web" />
        <ResumenCard titulo="Pagos MP" valor={resumen.pagos} detalle="Preferencias creadas" />
        <ResumenCard titulo="Aprobados" valor={resumen.aprobados} detalle="Plan activo o pago aprobado" destacado />
        <ResumenCard titulo="Pendientes" valor={resumen.pendientes} detalle="Pago o plan pendiente" alerta />
        <ResumenCard titulo="Total aprobado" valor={formatoMoneda(resumen.totalAprobado)} detalle="Monto bruto con IVA" destacado />
      </div>

      {cargando && <div style={mensaje}>Cargando solicitudes y pagos...</div>}

      {error && <div style={errorBox}>{error}</div>}

      {!cargando && !error && (
        <>
          <section style={panel}>
            <div style={panelHeader}>
              <div>
                <h2 style={panelTitle}>Pagos Mercado Pago</h2>
                <p style={panelSubtitle}>
                  Muestra quien pago, que plan contrato, montos, estado y datos tecnicos del pago.
                </p>
              </div>
              <span style={contador}>{pagos.length} registros</span>
            </div>

            {pagos.length === 0 ? (
              <div style={mensajeInterno}>No hay pagos Mercado Pago registrados.</div>
            ) : (
              <div style={tablaScroll}>
                <table style={tablaPagos}>
                  <thead>
                    <tr>
                      <th style={th}>Fecha</th>
                      <th style={th}>Cliente</th>
                      <th style={th}>Correo</th>
                      <th style={th}>Empresa / RUT</th>
                      <th style={th}>Plan</th>
                      <th style={th}>Usuarios</th>
                      <th style={thNumero}>Neto</th>
                      <th style={thNumero}>IVA</th>
                      <th style={thNumero}>Total</th>
                      <th style={th}>Pago</th>
                      <th style={th}>Plan</th>
                      <th style={thAccion}>Detalle</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pagos.map((pago) => {
                      const raw = normalizarRaw(pago.raw_response);
                      const datosMp = obtenerDatosMercadoPago(raw);
                      const expandido = pagoExpandido === pago.id;

                      return (
                        <Fragment key={pago.id}>
                          <tr style={tr}>
                            <td style={tdFecha}>{formatoFecha(pago.creado_en)}</td>
                            <td style={tdNombre}>{pago.nombre || datosMp.nombre || "-"}</td>
                            <td style={tdCorreo}>
                              <a href={`mailto:${pago.correo || datosMp.correo}`} style={linkCorreo}>
                                {pago.correo || datosMp.correo || "-"}
                              </a>
                            </td>
                            <td style={tdDoble}>
                              <strong>{pago.empresa || "-"}</strong>
                              <span>{pago.rut || datosMp.rut || "Sin RUT"}</span>
                            </td>
                            <td style={td}>{etiquetaPlan(pago.plan)}</td>
                            <td style={tdCentro}>{pago.usuarios_adicionales || 0}</td>
                            <td style={tdNumero}>{formatoMoneda(pago.subtotal_neto)}</td>
                            <td style={tdNumero}>{formatoMoneda(pago.iva)}</td>
                            <td style={tdNumeroDestacado}>{formatoMoneda(pago.monto)}</td>
                            <td style={tdEstado}>
                              <EstadoBadge estado={pago.estado} tipo="pago" />
                            </td>
                            <td style={tdEstado}>
                              <EstadoBadge estado={pago.estado_plan} tipo="plan" />
                            </td>
                            <td style={tdAccion}>
                              <button
                                style={botonDetalle}
                                onClick={() => setPagoExpandido(expandido ? null : pago.id)}
                                title="Ver detalle completo"
                              >
                                {expandido ? "-" : "+"}
                              </button>
                            </td>
                          </tr>

                          {expandido && (
                            <tr style={trDetalle}>
                              <td style={tdDetalle} colSpan={12}>
                                <DetallePago pago={pago} raw={raw} datosMp={datosMp} />
                              </td>
                            </tr>
                          )}
                        </Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <section style={panel}>
            <div style={panelHeader}>
              <div>
                <h2 style={panelTitle}>Solicitudes del formulario web</h2>
                <p style={panelSubtitle}>
                  Contactos que pidieron informacion antes de pagar.
                </p>
              </div>
              <span style={contador}>{solicitudes.length} registros</span>
            </div>

            {solicitudes.length === 0 ? (
              <div style={mensajeInterno}>No hay solicitudes web registradas.</div>
            ) : (
              <div style={tablaScroll}>
                <table style={tablaSolicitudes}>
                  <thead>
                    <tr>
                      <th style={th}>Estado</th>
                      <th style={th}>Nombre</th>
                      <th style={th}>Correo</th>
                      <th style={th}>Empresa</th>
                      <th style={th}>Interes</th>
                      <th style={th}>Mensaje</th>
                      <th style={th}>Fecha</th>
                      <th style={thAccion}>Accion</th>
                    </tr>
                  </thead>
                  <tbody>
                    {solicitudes.map((solicitud) => (
                      <tr key={solicitud.id} style={tr}>
                        <td style={tdEstado}>
                          <EstadoBadge estado={solicitud.estado || "pendiente"} />
                        </td>
                        <td style={tdNombre}>{solicitud.nombre || "-"}</td>
                        <td style={tdCorreo}>
                          <a href={`mailto:${solicitud.correo}`} style={linkCorreo}>
                            {solicitud.correo || "-"}
                          </a>
                        </td>
                        <td style={td}>{solicitud.empresa || "-"}</td>
                        <td style={td}>{solicitud.interes || "-"}</td>
                        <td style={tdMensaje} title={solicitud.mensaje || "Sin mensaje."}>
                          {solicitud.mensaje || "Sin mensaje."}
                        </td>
                        <td style={tdFecha}>{formatoFecha(solicitud.creado_en)}</td>
                        <td style={tdAccionCompacta}>
                          <a href={`mailto:${solicitud.correo}`} style={botonCorreo} title="Responder correo">
                            @
                          </a>

                          {solicitud.estado !== "contactado" && (
                            <button
                              style={botonCheck}
                              onClick={() => marcarContactado(solicitud.id)}
                              title="Marcar contactado"
                            >
                              OK
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}

function ResumenCard({ titulo, valor, detalle, destacado = false, alerta = false }) {
  return (
    <div
      style={{
        ...resumenCard,
        borderColor: destacado ? "#22c55e" : alerta ? "#f59e0b" : "#bae6fd",
      }}
    >
      <div style={resumenTitulo}>{titulo}</div>
      <div style={resumenValor}>{valor}</div>
      <div style={resumenDetalle}>{detalle}</div>
    </div>
  );
}

function EstadoBadge({ estado = "pendiente", tipo = "generico" }) {
  const texto = String(estado || "pendiente");
  const key = texto.toLowerCase();
  const aprobado = ["approved", "aprobado", "activo", "contactado"].includes(key);
  const rechazado = ["rejected", "cancelled", "rechazado", "error"].includes(key);
  const pendiente = !aprobado && !rechazado;

  return (
    <span
      style={{
        ...badge,
        background: aprobado ? "#dcfce7" : rechazado ? "#fee2e2" : "#fef3c7",
        color: aprobado ? "#166534" : rechazado ? "#991b1b" : "#92400e",
      }}
      title={tipo}
    >
      {pendiente ? etiquetaEstado(texto) : etiquetaEstado(texto)}
    </span>
  );
}

function DetallePago({ pago, raw, datosMp }) {
  const payment = raw?.payment || raw || {};
  const preference = raw?.preference || raw || {};
  const items = Array.isArray(preference?.items)
    ? preference.items
    : Array.isArray(payment?.additional_info?.items)
      ? payment.additional_info.items
      : [];

  return (
    <div style={detallePanel}>
      <div style={detalleGrid}>
        <CampoDetalle etiqueta="External reference" valor={pago.external_reference} mono />
        <CampoDetalle etiqueta="Preference ID" valor={pago.preference_id} mono />
        <CampoDetalle etiqueta="Payment ID" valor={pago.mp_payment_id || datosMp.paymentId} mono />
        <CampoDetalle etiqueta="Estado detalle" valor={pago.estado_detalle || datosMp.estadoDetalle} />
        <CampoDetalle etiqueta="Cliente MP" valor={datosMp.nombre || pago.nombre} />
        <CampoDetalle etiqueta="Correo pagador" valor={datosMp.correo || pago.correo} />
        <CampoDetalle etiqueta="RUT pagador" valor={datosMp.rut || pago.rut} />
        <CampoDetalle etiqueta="Telefono" valor={pago.telefono || datosMp.telefono} />
        <CampoDetalle etiqueta="Metodo de pago" valor={datosMp.metodoPago} />
        <CampoDetalle etiqueta="Tipo de pago" valor={datosMp.tipoPago} />
        <CampoDetalle etiqueta="Cuotas" valor={datosMp.cuotas} />
        <CampoDetalle etiqueta="Fecha aprobacion" valor={formatoFecha(datosMp.fechaAprobacion)} />
        <CampoDetalle etiqueta="Meses cobrados" valor={pago.meses_cobrados || "-"} />
        <CampoDetalle etiqueta="Moneda" valor={pago.moneda || "CLP"} />
        <CampoDetalle etiqueta="Creado" valor={formatoFecha(pago.creado_en)} />
        <CampoDetalle etiqueta="Actualizado" valor={formatoFecha(pago.actualizado_en)} />
      </div>

      {pago.mensaje && (
        <div style={mensajeCompra}>
          <strong>Mensaje del comprador:</strong> {pago.mensaje}
        </div>
      )}

      {pago.init_point && (
        <a href={pago.init_point} target="_blank" rel="noreferrer" style={linkPago}>
          Abrir preferencia de pago en Mercado Pago
        </a>
      )}

      <div style={itemsPanel}>
        <strong>Detalle de compra enviado a Mercado Pago</strong>
        {items.length === 0 ? (
          <span style={textoSuave}>Sin items disponibles en la respuesta tecnica.</span>
        ) : (
          <table style={tablaItems}>
            <thead>
              <tr>
                <th style={thMini}>Item</th>
                <th style={thMini}>Descripcion</th>
                <th style={thMiniNumero}>Cantidad</th>
                <th style={thMiniNumero}>Precio</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, index) => (
                <tr key={`${item.title || "item"}-${index}`}>
                  <td style={tdMini}>{item.title || item.id || "Item"}</td>
                  <td style={tdMini}>{item.description || "-"}</td>
                  <td style={tdMiniNumero}>{item.quantity || 1}</td>
                  <td style={tdMiniNumero}>{formatoMoneda(item.unit_price || item.unitPrice || item.price)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <details style={rawBox}>
        <summary style={rawSummary}>Respuesta completa Mercado Pago</summary>
        <pre style={pre}>{JSON.stringify(raw || {}, null, 2)}</pre>
      </details>
    </div>
  );
}

function CampoDetalle({ etiqueta, valor, mono = false }) {
  return (
    <div style={detalleItem}>
      <span style={detalleEtiqueta}>{etiqueta}</span>
      <strong style={{ ...detalleValor, fontFamily: mono ? "Consolas, monospace" : undefined }}>
        {valor === undefined || valor === null || valor === "" ? "-" : String(valor)}
      </strong>
    </div>
  );
}

function numero(valor) {
  const n = Number(valor || 0);
  return Number.isFinite(n) ? n : 0;
}

function formatoMoneda(valor) {
  return new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    maximumFractionDigits: 0,
  }).format(numero(valor));
}

function formatoFecha(fecha) {
  return fecha ? new Date(fecha).toLocaleString("es-CL") : "-";
}

function etiquetaPlan(plan) {
  if (String(plan || "").toLowerCase() === "anual") return "Anual";
  if (String(plan || "").toLowerCase() === "mensual") return "Mensual";
  return plan || "-";
}

function etiquetaEstado(estado) {
  const mapa = {
    approved: "Aprobado",
    pending: "Pendiente",
    in_process: "En proceso",
    rejected: "Rechazado",
    cancelled: "Cancelado",
    activo: "Activo",
    pendiente: "Pendiente",
    contactado: "Contactado",
  };

  return mapa[String(estado || "").toLowerCase()] || estado || "Pendiente";
}

function esPagoAprobado(pago) {
  return (
    String(pago.estado || "").toLowerCase() === "approved" ||
    String(pago.estado_plan || "").toLowerCase() === "activo"
  );
}

function normalizarRaw(raw) {
  if (!raw) return {};
  if (typeof raw === "object") return raw;

  try {
    return JSON.parse(raw);
  } catch {
    return { respuesta: String(raw) };
  }
}

function obtenerDatosMercadoPago(raw = {}) {
  const payment = raw.payment || raw || {};
  const preference = raw.preference || raw || {};
  const payer = payment.payer || preference.payer || {};
  const metadata = payment.metadata || preference.metadata || {};
  const identification = payer.identification || {};
  const phone = payer.phone || {};
  const metodo = payment.payment_method || {};

  return {
    paymentId: payment.id,
    nombre: [payer.first_name, payer.last_name].filter(Boolean).join(" ") || payer.name || metadata.nombre,
    correo: payer.email || metadata.correo,
    rut: identification.number || metadata.rut,
    telefono: phone.number || metadata.telefono,
    metodoPago: metodo.id || payment.payment_method_id || "-",
    tipoPago: payment.payment_type_id || "-",
    cuotas: payment.installments || "-",
    estadoDetalle: payment.status_detail || "-",
    fechaAprobacion: payment.date_approved || payment.date_created || preference.date_created,
  };
}

const contenedor = {
  padding: "12px 16px",
  color: "#0f2742",
};

const cabecera = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: "10px",
  marginBottom: "10px",
};

const accionesCabecera = {
  display: "flex",
  gap: "8px",
  flexWrap: "wrap",
  justifyContent: "flex-end",
};

const titulo = {
  margin: 0,
  fontSize: "22px",
  lineHeight: 1,
  fontWeight: 900,
};

const subtitulo = {
  margin: "5px 0 0",
  color: "#64748b",
  fontSize: "12px",
};

const botonActualizar = {
  border: "none",
  borderRadius: "9px",
  padding: "7px 12px",
  background: "linear-gradient(135deg, #0f5c99, #06b6d4)",
  color: "white",
  fontSize: "12px",
  fontWeight: 900,
  cursor: "pointer",
  minHeight: "32px",
};

const botonVolver = {
  ...botonActualizar,
  background: "#0f5c99",
};

const resumenGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
  gap: "8px",
  marginBottom: "10px",
};

const resumenCard = {
  background: "rgba(255,255,255,0.92)",
  border: "1px solid #bae6fd",
  borderRadius: "12px",
  padding: "10px 12px",
  boxShadow: "0 6px 18px rgba(15, 92, 153, 0.07)",
};

const resumenTitulo = {
  fontSize: "11px",
  fontWeight: 900,
  color: "#075985",
  textTransform: "uppercase",
  letterSpacing: "0.02em",
};

const resumenValor = {
  fontSize: "20px",
  fontWeight: 950,
  marginTop: "4px",
  color: "#082f49",
};

const resumenDetalle = {
  fontSize: "11px",
  color: "#64748b",
  marginTop: "3px",
};

const panel = {
  overflow: "hidden",
  background: "white",
  border: "1px solid #dbeafe",
  borderRadius: "14px",
  boxShadow: "0 8px 22px rgba(15, 92, 153, 0.07)",
  marginBottom: "12px",
};

const panelHeader = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "10px",
  padding: "10px 12px",
  borderBottom: "1px solid #e2e8f0",
};

const panelTitle = {
  margin: 0,
  fontSize: "18px",
  color: "#075985",
  fontWeight: 950,
};

const panelSubtitle = {
  margin: "3px 0 0",
  fontSize: "11px",
  color: "#64748b",
};

const contador = {
  borderRadius: "999px",
  padding: "5px 9px",
  background: "#e0f2fe",
  color: "#075985",
  fontSize: "11px",
  fontWeight: 900,
  whiteSpace: "nowrap",
};

const tablaScroll = {
  overflowX: "auto",
};

const tablaPagos = {
  width: "100%",
  borderCollapse: "collapse",
  tableLayout: "fixed",
  minWidth: "1320px",
};

const tablaSolicitudes = {
  width: "100%",
  borderCollapse: "collapse",
  tableLayout: "fixed",
  minWidth: "1080px",
};

const th = {
  padding: "8px 9px",
  background: "#dff3ff",
  color: "#075985",
  fontSize: "11px",
  fontWeight: 950,
  textAlign: "left",
  whiteSpace: "nowrap",
};

const thNumero = {
  ...th,
  textAlign: "right",
};

const thAccion = {
  ...th,
  textAlign: "center",
};

const tr = {
  borderBottom: "1px solid #e2e8f0",
};

const trDetalle = {
  borderBottom: "1px solid #bae6fd",
  background: "#f8fcff",
};

const td = {
  padding: "7px 9px",
  fontSize: "11px",
  lineHeight: 1.25,
  color: "#0f2742",
  verticalAlign: "middle",
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
};

const tdFecha = {
  ...td,
  width: "125px",
  color: "#64748b",
};

const tdNombre = {
  ...td,
  width: "150px",
  fontWeight: 900,
  color: "#082f49",
};

const tdCorreo = {
  ...td,
  width: "210px",
};

const tdDoble = {
  ...td,
  width: "190px",
};

tdDoble.display = "flex";
tdDoble.flexDirection = "column";
tdDoble.gap = "2px";

const tdCentro = {
  ...td,
  textAlign: "center",
};

const tdNumero = {
  ...td,
  textAlign: "right",
  fontVariantNumeric: "tabular-nums",
};

const tdNumeroDestacado = {
  ...tdNumero,
  color: "#075985",
  fontWeight: 950,
};

const tdEstado = {
  ...td,
  width: "105px",
};

const tdMensaje = {
  ...td,
  width: "260px",
};

const tdAccion = {
  ...td,
  width: "74px",
  textAlign: "center",
};

const tdAccionCompacta = {
  ...td,
  width: "105px",
  textAlign: "center",
  whiteSpace: "nowrap",
};

const tdDetalle = {
  padding: "10px 12px",
};

const linkCorreo = {
  color: "#0f5c99",
  fontWeight: 850,
  textDecoration: "none",
};

const badge = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  borderRadius: "999px",
  padding: "4px 7px",
  fontSize: "10px",
  lineHeight: 1,
  fontWeight: 950,
  textTransform: "uppercase",
  whiteSpace: "nowrap",
};

const botonDetalle = {
  border: "none",
  width: "28px",
  height: "28px",
  borderRadius: "9px",
  background: "linear-gradient(135deg, #0f5c99, #06b6d4)",
  color: "white",
  fontSize: "16px",
  lineHeight: 1,
  fontWeight: 950,
  cursor: "pointer",
};

const botonCorreo = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  width: "28px",
  height: "28px",
  borderRadius: "9px",
  background: "#e0f2fe",
  color: "#075985",
  fontSize: "12px",
  fontWeight: 950,
  textDecoration: "none",
};

const botonCheck = {
  ...botonCorreo,
  border: "none",
  background: "#16a34a",
  color: "white",
  marginLeft: "5px",
  cursor: "pointer",
};

const detallePanel = {
  display: "grid",
  gap: "9px",
};

const detalleGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))",
  gap: "7px",
};

const detalleItem = {
  border: "1px solid #dbeafe",
  borderRadius: "10px",
  background: "white",
  padding: "7px 8px",
  minWidth: 0,
};

const detalleEtiqueta = {
  display: "block",
  fontSize: "10px",
  color: "#64748b",
  fontWeight: 850,
  marginBottom: "3px",
};

const detalleValor = {
  display: "block",
  fontSize: "11px",
  color: "#0f2742",
  overflowWrap: "anywhere",
};

const mensajeCompra = {
  border: "1px solid #bae6fd",
  borderRadius: "10px",
  background: "#eff6ff",
  padding: "8px 10px",
  fontSize: "11px",
  color: "#0f2742",
};

const linkPago = {
  justifySelf: "start",
  borderRadius: "9px",
  padding: "7px 10px",
  background: "#e0f2fe",
  color: "#075985",
  fontSize: "11px",
  fontWeight: 900,
  textDecoration: "none",
};

const itemsPanel = {
  display: "grid",
  gap: "7px",
  border: "1px solid #dbeafe",
  borderRadius: "12px",
  background: "white",
  padding: "9px",
  fontSize: "11px",
};

const tablaItems = {
  width: "100%",
  borderCollapse: "collapse",
};

const thMini = {
  padding: "6px 7px",
  background: "#f0f9ff",
  color: "#075985",
  fontSize: "10px",
  textAlign: "left",
};

const thMiniNumero = {
  ...thMini,
  textAlign: "right",
};

const tdMini = {
  padding: "6px 7px",
  borderBottom: "1px solid #e2e8f0",
  fontSize: "10px",
};

const tdMiniNumero = {
  ...tdMini,
  textAlign: "right",
  fontVariantNumeric: "tabular-nums",
};

const textoSuave = {
  color: "#64748b",
};

const rawBox = {
  border: "1px solid #dbeafe",
  borderRadius: "12px",
  background: "white",
  padding: "8px 10px",
};

const rawSummary = {
  cursor: "pointer",
  color: "#075985",
  fontSize: "11px",
  fontWeight: 900,
};

const pre = {
  margin: "8px 0 0",
  maxHeight: "260px",
  overflow: "auto",
  background: "#0f172a",
  color: "#dbeafe",
  borderRadius: "10px",
  padding: "10px",
  fontSize: "10px",
  lineHeight: 1.35,
};

const mensaje = {
  padding: "10px 12px",
  borderRadius: "12px",
  background: "#f8fafc",
  color: "#334155",
  marginBottom: "10px",
  fontSize: "12px",
};

const mensajeInterno = {
  ...mensaje,
  margin: "10px 12px",
};

const errorBox = {
  padding: "10px 12px",
  borderRadius: "12px",
  background: "#fee2e2",
  color: "#991b1b",
  marginBottom: "10px",
  fontSize: "12px",
  fontWeight: 900,
};
