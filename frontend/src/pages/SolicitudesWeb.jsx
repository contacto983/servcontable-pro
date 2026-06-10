import { useEffect, useMemo, useState } from "react";
import {
  listarSolicitudesWeb,
  marcarSolicitudContactada,
} from "../services/solicitudesWebService";

function formatoMoneda(valor) {
  const numero = Number(valor || 0);
  return numero.toLocaleString("es-CL", {
    style: "currency",
    currency: "CLP",
    maximumFractionDigits: 0,
  });
}

function formatoFecha(valor) {
  if (!valor) return "-";

  const fecha = new Date(valor);

  if (Number.isNaN(fecha.getTime())) {
    return "-";
  }

  return fecha.toLocaleString("es-CL", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function texto(valor) {
  return valor === undefined || valor === null || valor === "" ? "-" : valor;
}

function normalizar(valor = "") {
  return String(valor || "").trim().toLowerCase();
}

function obtenerBadgeEstado(estado = "") {
  const estadoNormalizado = normalizar(estado);

  if (["activo", "approved", "aprobado", "pagado"].includes(estadoNormalizado)) {
    return badgeVerde;
  }

  if (
    ["rechazado", "rejected", "cancelled", "cancelado", "error_preferencia"].includes(
      estadoNormalizado
    )
  ) {
    return badgeRojo;
  }

  if (estadoNormalizado.includes("pendiente")) {
    return badgeAmarillo;
  }

  return badgeAzul;
}

function estaContactado(solicitud) {
  return normalizar(solicitud?.gestion?.estado) === "contactado";
}

function descripcionPago(solicitud) {
  const pago = solicitud?.pago_mercado_pago || {};

  if (!solicitud?.mp_payment_id && !pago.id) {
    return "Sin pago confirmado";
  }

  return [
    pago.tipo_pago || "Pago",
    pago.medio_pago,
    pago.cuotas ? `${pago.cuotas} cuotas` : "",
  ]
    .filter(Boolean)
    .join(" / ");
}

function Icono({ tipo }) {
  const trazo = {
    stroke: "currentColor",
    strokeWidth: 2,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    fill: "none",
  };

  const iconos = {
    actualizar: (
      <>
        <path {...trazo} d="M20 11a8 8 0 0 0-14.6-4.5L4 8" />
        <path {...trazo} d="M4 4v4h4" />
        <path {...trazo} d="M4 13a8 8 0 0 0 14.6 4.5L20 16" />
        <path {...trazo} d="M20 20v-4h-4" />
      </>
    ),
    correo: (
      <>
        <path {...trazo} d="M4 6h16v12H4z" />
        <path {...trazo} d="m4 7 8 6 8-6" />
      </>
    ),
    ok: (
      <>
        <path {...trazo} d="M20 6 9 17l-5-5" />
      </>
    ),
  };

  return (
    <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
      {iconos[tipo]}
    </svg>
  );
}

export default function SolicitudesWeb() {
  const [solicitudes, setSolicitudes] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");

  const resumen = useMemo(() => {
    return solicitudes.reduce(
      (acc, solicitud) => {
        const estado = normalizar(solicitud.estado);

        acc.total += 1;

        if (["activo", "approved", "pagado"].includes(estado)) {
          acc.pagadas += 1;
        }

        if (estado.includes("pendiente")) {
          acc.pendientes += 1;
        }

        if (estaContactado(solicitud)) {
          acc.contactadas += 1;
        }

        acc.totalPagado += ["activo", "approved", "pagado"].includes(estado)
          ? Number(solicitud.total || 0)
          : 0;

        return acc;
      },
      { total: 0, pagadas: 0, pendientes: 0, contactadas: 0, totalPagado: 0 }
    );
  }, [solicitudes]);

  useEffect(() => {
    cargarSolicitudes();
  }, []);

  async function cargarSolicitudes() {
    try {
      setCargando(true);
      setError("");
      setMensaje("");

      const data = await listarSolicitudesWeb();
      setSolicitudes(Array.isArray(data?.solicitudes) ? data.solicitudes : []);
    } catch (err) {
      setError(err.message);
    } finally {
      setCargando(false);
    }
  }

  async function marcarContactado(id) {
    try {
      setError("");
      setMensaje("");

      await marcarSolicitudContactada(id);
      setMensaje("Solicitud marcada como contactada.");
      await cargarSolicitudes();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div>
      <div style={cabecera}>
        <div>
          <h1 style={titulo}>Solicitudes Web</h1>
          <p style={subtitulo}>
            Clientes, demos y pagos generados desde servcontablepro.cl.
          </p>
        </div>

        <button style={botonPrincipal} type="button" onClick={cargarSolicitudes}>
          <Icono tipo="actualizar" /> Actualizar
        </button>
      </div>

      {mensaje && <p style={ok}>{mensaje}</p>}
      {error && <p style={errorTexto}>{error}</p>}

      <div style={gridResumen}>
        <ResumenCard titulo="Solicitudes" valor={resumen.total} />
        <ResumenCard titulo="Pagadas" valor={resumen.pagadas} destacado />
        <ResumenCard titulo="Pendientes" valor={resumen.pendientes} />
        <ResumenCard titulo="Contactadas" valor={resumen.contactadas} />
        <ResumenCard titulo="Total pagado" valor={formatoMoneda(resumen.totalPagado)} destacado />
      </div>

      <section style={card}>
        <div style={cabeceraTabla}>
          <h2 style={tituloSeccion}>Detalle de solicitudes</h2>
          {cargando && <span style={badgeAzul}>Cargando...</span>}
        </div>

        <div style={{ overflowX: "auto" }}>
          <table style={tabla}>
            <thead>
              <tr>
                <th style={th}>Fecha</th>
                <th style={th}>Cliente</th>
                <th style={th}>Plan</th>
                <th style={th}>Total</th>
                <th style={th}>Estado</th>
                <th style={th}>Pago MP</th>
                <th style={th}>Detalle</th>
                <th style={th}>Accion</th>
              </tr>
            </thead>

            <tbody>
              {solicitudes.map((solicitud) => {
                const pago = solicitud.pago_mercado_pago || {};
                const contactado = estaContactado(solicitud);

                return (
                  <tr key={solicitud.id}>
                    <td style={td}>{formatoFecha(solicitud.creado_en)}</td>
                    <td style={td}>
                      <strong>{texto(solicitud.nombre)}</strong>
                      <small style={textoSecundario}>{texto(solicitud.correo)}</small>
                      <small style={textoSecundario}>
                        {texto(solicitud.telefono || solicitud.rut)}
                      </small>
                    </td>
                    <td style={td}>
                      <strong>{texto(solicitud.periodicidad)}</strong>
                      <small style={textoSecundario}>
                        {texto(solicitud.empresa || "Sin empresa informada")}
                      </small>
                    </td>
                    <td style={td}>
                      <strong>{formatoMoneda(solicitud.total)}</strong>
                      <small style={textoSecundario}>
                        Neto {formatoMoneda(solicitud.monto_neto)} / IVA{" "}
                        {formatoMoneda(solicitud.iva)}
                      </small>
                    </td>
                    <td style={td}>
                      <span style={obtenerBadgeEstado(solicitud.estado)}>
                        {texto(solicitud.estado)}
                      </span>
                      {contactado && <span style={badgeVerde}>Contactado</span>}
                    </td>
                    <td style={td}>
                      <strong>{texto(solicitud.mp_payment_id || pago.id)}</strong>
                      <small style={textoSecundario}>
                        {descripcionPago(solicitud)}
                      </small>
                    </td>
                    <td style={tdDetalle}>
                      <details>
                        <summary style={summary}>Ver detalle</summary>
                        <div style={detalleGrid}>
                          <Dato label="Preferencia" valor={solicitud.mp_preference_id} />
                          <Dato label="Estado MP" valor={solicitud.mp_status || pago.estado} />
                          <Dato
                            label="Detalle MP"
                            valor={solicitud.mp_status_detail || pago.detalle_estado}
                          />
                          <Dato label="Fecha pago" valor={formatoFecha(pago.fecha_aprobacion)} />
                          <Dato label="Monto MP" valor={formatoMoneda(pago.monto)} />
                          <Dato label="Recibido MP" valor={formatoMoneda(pago.monto_recibido)} />
                          <Dato
                            label="Pagador"
                            valor={pago.pagador?.correo || solicitud.correo}
                          />
                          <Dato
                            label="RUT pagador"
                            valor={pago.pagador?.identificacion_numero}
                          />
                          <Dato label="Actualizado" valor={formatoFecha(solicitud.actualizado_en)} />
                        </div>
                      </details>
                    </td>
                    <td style={tdAccion}>
                      <a
                        style={botonIconoAzul}
                        title="Responder correo"
                        aria-label="Responder correo"
                        href={`mailto:${solicitud.correo}`}
                      >
                        <Icono tipo="correo" />
                      </a>

                      <button
                        style={contactado ? botonIconoGris : botonIconoVerde}
                        type="button"
                        title="Marcar contactado"
                        aria-label="Marcar contactado"
                        disabled={contactado}
                        onClick={() => marcarContactado(solicitud.id)}
                      >
                        <Icono tipo="ok" />
                      </button>
                    </td>
                  </tr>
                );
              })}

              {solicitudes.length === 0 && !cargando && (
                <tr>
                  <td style={td} colSpan="8">
                    No hay solicitudes web registradas.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function ResumenCard({ titulo, valor, destacado = false }) {
  return (
    <div style={destacado ? cardResumenDestacado : cardResumen}>
      <strong>{titulo}</strong>
      <span>{valor}</span>
    </div>
  );
}

function Dato({ label, valor }) {
  return (
    <div style={dato}>
      <strong>{label}</strong>
      <span>{texto(valor)}</span>
    </div>
  );
}

const cabecera = {
  display: "flex",
  justifyContent: "space-between",
  gap: "14px",
  alignItems: "center",
  marginBottom: "14px",
};

const titulo = {
  fontSize: "28px",
  color: "#082f49",
  margin: 0,
};

const subtitulo = {
  color: "#456179",
  margin: "4px 0 0",
  fontSize: "14px",
};

const gridResumen = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
  gap: "10px",
  marginBottom: "14px",
};

const cardResumen = {
  background: "rgba(255, 255, 255, 0.92)",
  border: "1px solid #bae6fd",
  borderRadius: "14px",
  padding: "12px 14px",
  boxShadow: "0 10px 24px rgba(14, 165, 233, 0.10)",
  display: "grid",
  gap: "5px",
};

const cardResumenDestacado = {
  ...cardResumen,
  borderColor: "#22c55e",
};

const card = {
  background: "white",
  borderRadius: "16px",
  padding: "16px",
  boxShadow: "0 14px 32px rgba(3, 105, 161, 0.12)",
};

const cabeceraTabla = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: "12px",
  marginBottom: "8px",
};

const tituloSeccion = {
  color: "#0369a1",
  fontSize: "22px",
  margin: 0,
};

const tabla = {
  width: "100%",
  borderCollapse: "collapse",
  fontSize: "13px",
};

const th = {
  background: "#dff6ff",
  color: "#075985",
  textAlign: "left",
  padding: "9px",
  whiteSpace: "nowrap",
};

const td = {
  padding: "9px",
  borderBottom: "1px solid #d8e7ef",
  verticalAlign: "top",
};

const tdDetalle = {
  ...td,
  minWidth: "260px",
};

const tdAccion = {
  ...td,
  whiteSpace: "nowrap",
};

const textoSecundario = {
  display: "block",
  color: "#475569",
  marginTop: "3px",
};

const summary = {
  cursor: "pointer",
  color: "#0284c7",
  fontWeight: 700,
};

const detalleGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))",
  gap: "7px",
  marginTop: "8px",
};

const dato = {
  background: "#f8fafc",
  border: "1px solid #e0f2fe",
  borderRadius: "10px",
  padding: "7px",
  display: "grid",
  gap: "2px",
};

const badgeBase = {
  display: "inline-flex",
  alignItems: "center",
  borderRadius: "999px",
  padding: "4px 9px",
  fontSize: "12px",
  fontWeight: 700,
  marginRight: "5px",
};

const badgeVerde = {
  ...badgeBase,
  background: "#dcfce7",
  color: "#047857",
};

const badgeAmarillo = {
  ...badgeBase,
  background: "#fef3c7",
  color: "#92400e",
};

const badgeRojo = {
  ...badgeBase,
  background: "#fee2e2",
  color: "#b91c1c",
};

const badgeAzul = {
  ...badgeBase,
  background: "#e0f2fe",
  color: "#075985",
};

const botonPrincipal = {
  display: "inline-flex",
  alignItems: "center",
  gap: "8px",
  background: "linear-gradient(135deg, #0f5f97, #06b6d4)",
  color: "white",
  border: "none",
  borderRadius: "12px",
  padding: "10px 14px",
  fontWeight: 800,
  cursor: "pointer",
};

const botonIconoBase = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  width: "34px",
  height: "34px",
  border: "none",
  borderRadius: "10px",
  color: "white",
  marginRight: "6px",
  cursor: "pointer",
  textDecoration: "none",
};

const botonIconoAzul = {
  ...botonIconoBase,
  background: "#0284c7",
};

const botonIconoVerde = {
  ...botonIconoBase,
  background: "#10b981",
};

const botonIconoGris = {
  ...botonIconoBase,
  background: "#94a3b8",
  cursor: "not-allowed",
};

const ok = {
  color: "#059669",
  fontWeight: "bold",
  margin: "0 0 10px",
};

const errorTexto = {
  color: "#dc2626",
  fontWeight: "bold",
  margin: "0 0 10px",
};
