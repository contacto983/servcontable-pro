import { useEffect, useState } from "react";
import {
  listarSolicitudesContacto,
  actualizarSolicitudContacto,
} from "../services/solicitudesContactoService";

export default function SolicitudesWeb({ volverAlPanel }) {
  const [solicitudes, setSolicitudes] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  async function cargarSolicitudes() {
    try {
      setCargando(true);
      setError("");
      const data = await listarSolicitudesContacto();
      setSolicitudes(data);
    } catch (err) {
      setError(err.message || "Error al cargar solicitudes.");
    } finally {
      setCargando(false);
    }
  }

  async function marcarContactado(id) {
    try {
      await actualizarSolicitudContacto(id, {
        estado: "contactado",
      });

      await cargarSolicitudes();
    } catch (err) {
      alert(err.message || "No se pudo actualizar la solicitud.");
    }
  }

  function formatoFecha(fecha) {
    return fecha ? new Date(fecha).toLocaleString("es-CL") : "";
  }

  useEffect(() => {
    cargarSolicitudes();
  }, []);

  return (
    <div style={contenedor}>
      <div style={cabecera}>
        <div>
          <h1 style={titulo}>Solicitudes Web</h1>
          <p style={subtitulo}>
            Clientes que completaron el formulario de servcontablepro.cl
          </p>
        </div>

        <div style={accionesCabecera}>
          <button style={botonActualizar} onClick={cargarSolicitudes}>
            Actualizar
          </button>

          <button style={botonActualizar} onClick={volverAlPanel}>
            Volver al panel
          </button>
        </div>
      </div>

      {cargando && <div style={mensaje}>Cargando solicitudes...</div>}

      {error && <div style={errorBox}>{error}</div>}

      {!cargando && !error && solicitudes.length === 0 && (
        <div style={mensaje}>No hay solicitudes web registradas.</div>
      )}

      {!cargando && !error && solicitudes.length > 0 && (
        <div style={listaPanel}>
          <table style={tabla}>
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
                    <span
                      style={{
                        ...badge,
                        background:
                          solicitud.estado === "contactado" ? "#dcfce7" : "#fef3c7",
                        color:
                          solicitud.estado === "contactado" ? "#166534" : "#92400e",
                      }}
                    >
                      {solicitud.estado || "pendiente"}
                    </span>
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
                  <td style={tdAccion}>
                    <a href={`mailto:${solicitud.correo}`} style={botonSecundario}>
                      Correo
                    </a>

                    {solicitud.estado !== "contactado" && (
                      <button
                        style={botonPrincipal}
                        onClick={() => marcarContactado(solicitud.id)}
                      >
                        Contactado
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

const contenedor = {
  padding: "14px 18px",
  color: "#0f2742",
};

const cabecera = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: "12px",
  marginBottom: "12px",
};

const accionesCabecera = {
  display: "flex",
  gap: "8px",
  flexWrap: "wrap",
  justifyContent: "flex-end",
};

const titulo = {
  margin: 0,
  fontSize: "23px",
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
  borderRadius: "10px",
  padding: "8px 13px",
  background: "linear-gradient(135deg, #0f5c99, #0891b2)",
  color: "white",
  fontSize: "12px",
  fontWeight: 800,
  cursor: "pointer",
  minHeight: "34px",
};

const listaPanel = {
  overflowX: "auto",
  background: "white",
  border: "1px solid #dbeafe",
  borderRadius: "14px",
  boxShadow: "0 8px 22px rgba(15, 92, 153, 0.07)",
};

const tabla = {
  width: "100%",
  borderCollapse: "collapse",
  tableLayout: "fixed",
  minWidth: "1120px",
};

const th = {
  padding: "9px 10px",
  background: "#dff3ff",
  color: "#075985",
  fontSize: "12px",
  fontWeight: 900,
  textAlign: "left",
  whiteSpace: "nowrap",
};

const thAccion = {
  ...th,
  textAlign: "center",
};

const tr = {
  borderBottom: "1px solid #e2e8f0",
};

const td = {
  padding: "8px 10px",
  fontSize: "12px",
  lineHeight: 1.25,
  color: "#0f2742",
  verticalAlign: "middle",
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
};

const tdEstado = {
  ...td,
  width: "105px",
};

const tdNombre = {
  ...td,
  width: "150px",
  fontWeight: 900,
  color: "#082f49",
};

const tdCorreo = {
  ...td,
  width: "220px",
};

const tdMensaje = {
  ...td,
  width: "280px",
};

const tdFecha = {
  ...td,
  width: "155px",
  color: "#64748b",
};

const tdAccion = {
  ...td,
  width: "175px",
  textAlign: "center",
  whiteSpace: "nowrap",
};

const linkCorreo = {
  color: "#0f5c99",
  fontWeight: 800,
  textDecoration: "none",
};

const badge = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  borderRadius: "999px",
  padding: "4px 8px",
  fontSize: "10px",
  lineHeight: 1,
  fontWeight: 900,
  textTransform: "uppercase",
  whiteSpace: "nowrap",
};

const botonPrincipal = {
  border: "none",
  borderRadius: "8px",
  padding: "7px 9px",
  background: "#0891b2",
  color: "white",
  fontSize: "11px",
  fontWeight: 800,
  cursor: "pointer",
  marginLeft: "6px",
};

const botonSecundario = {
  display: "inline-flex",
  borderRadius: "8px",
  padding: "7px 9px",
  background: "#e0f2fe",
  color: "#075985",
  fontSize: "11px",
  fontWeight: 800,
  textDecoration: "none",
};

const mensaje = {
  padding: "12px 14px",
  borderRadius: "12px",
  background: "#f8fafc",
  color: "#334155",
  marginBottom: "12px",
  fontSize: "13px",
};

const errorBox = {
  padding: "12px 14px",
  borderRadius: "12px",
  background: "#fee2e2",
  color: "#991b1b",
  marginBottom: "12px",
  fontSize: "13px",
  fontWeight: 800,
};
