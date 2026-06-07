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

        <div style={{ display: "flex", gap: "10px" }}>
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

      <div style={grid}>
        {solicitudes.map((solicitud) => (
          <article key={solicitud.id} style={card}>
            <div style={cardTop}>
              <div>
                <h2 style={nombre}>{solicitud.nombre}</h2>
                <p style={correo}>{solicitud.correo}</p>
              </div>

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
            </div>

            <div style={detalle}>
              <strong>Empresa:</strong> {solicitud.empresa || "-"}
            </div>

            <div style={detalle}>
              <strong>Interés:</strong> {solicitud.interes || "-"}
            </div>

            <div style={mensajeCliente}>
              {solicitud.mensaje || "Sin mensaje."}
            </div>

            <div style={fecha}>
              {solicitud.creado_en
                ? new Date(solicitud.creado_en).toLocaleString("es-CL")
                : ""}
            </div>

            <div style={acciones}>
              <a href={`mailto:${solicitud.correo}`} style={botonSecundario}>
                Responder correo
              </a>

              {solicitud.estado !== "contactado" && (
                <button
                  style={botonPrincipal}
                  onClick={() => marcarContactado(solicitud.id)}
                >
                  Marcar contactado
                </button>
              )}
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

const contenedor = {
  padding: "32px",
  color: "#0f2742",
};

const cabecera = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: "16px",
  marginBottom: "24px",
};

const titulo = {
  margin: 0,
  fontSize: "30px",
  fontWeight: 900,
};

const subtitulo = {
  margin: "8px 0 0",
  color: "#64748b",
};

const botonActualizar = {
  border: "none",
  borderRadius: "12px",
  padding: "12px 18px",
  background: "#0f5c99",
  color: "white",
  fontWeight: 800,
  cursor: "pointer",
};

const grid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
  gap: "18px",
};

const card = {
  background: "white",
  border: "1px solid #dbeafe",
  borderRadius: "18px",
  padding: "20px",
  boxShadow: "0 10px 30px rgba(15, 92, 153, 0.08)",
};

const cardTop = {
  display: "flex",
  justifyContent: "space-between",
  gap: "12px",
  alignItems: "flex-start",
};

const nombre = {
  margin: 0,
  fontSize: "20px",
  fontWeight: 900,
};

const correo = {
  margin: "6px 0 0",
  color: "#0f5c99",
  fontWeight: 700,
};

const badge = {
  borderRadius: "999px",
  padding: "6px 10px",
  fontSize: "12px",
  fontWeight: 900,
  textTransform: "uppercase",
};

const detalle = {
  marginTop: "14px",
  color: "#1e293b",
};

const mensajeCliente = {
  marginTop: "14px",
  padding: "14px",
  borderRadius: "12px",
  background: "#f8fafc",
  color: "#334155",
  lineHeight: 1.5,
};

const fecha = {
  marginTop: "12px",
  fontSize: "13px",
  color: "#64748b",
};

const acciones = {
  display: "flex",
  gap: "10px",
  flexWrap: "wrap",
  marginTop: "16px",
};

const botonPrincipal = {
  border: "none",
  borderRadius: "10px",
  padding: "10px 14px",
  background: "#0891b2",
  color: "white",
  fontWeight: 800,
  cursor: "pointer",
};

const botonSecundario = {
  borderRadius: "10px",
  padding: "10px 14px",
  background: "#e0f2fe",
  color: "#075985",
  fontWeight: 800,
  textDecoration: "none",
};

const mensaje = {
  padding: "18px",
  borderRadius: "14px",
  background: "#f8fafc",
  color: "#334155",
  marginBottom: "18px",
};

const errorBox = {
  padding: "18px",
  borderRadius: "14px",
  background: "#fee2e2",
  color: "#991b1b",
  marginBottom: "18px",
  fontWeight: 800,
};