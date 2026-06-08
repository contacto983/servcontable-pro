import { useState } from "react";
import {
  loginDemo,
  loginUsuario,
  resetearPasswordConToken,
  solicitarRecuperacionPassword,
} from "../services/authService";

const LOGO_SRC = "/servcontable-logo.png";

export default function Login({ irARegistro, loginCorrecto }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nuevaPassword, setNuevaPassword] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [urlResetDesarrollo, setUrlResetDesarrollo] = useState("");
  const [error, setError] = useState("");
  const [resetToken, setResetToken] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get("resetToken") || "";
  });
  const [modoRecuperacion, setModoRecuperacion] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return Boolean(params.get("resetToken"));
  });
  const permiteRegistroPublico =
    import.meta.env.VITE_ALLOW_PUBLIC_REGISTRATION === "true";
  const permiteDemo = import.meta.env.VITE_DEMO_MODE === "true";

  async function manejarLogin(e) {
    e.preventDefault();

    if (permiteDemo) {
      return;
    }

    try {
      setError("");
      setMensaje("");
      setUrlResetDesarrollo("");

      const data = await loginUsuario(email, password);

      loginCorrecto(data.usuario);
    } catch (err) {
      setError(err.message);
    }
  }

  async function manejarDemo() {
    try {
      setError("");
      setMensaje("");
      setUrlResetDesarrollo("");

      const data = await loginDemo();

      loginCorrecto(data.usuario);
    } catch (err) {
      setError(err.message);
    }
  }

  async function manejarSolicitudRecuperacion(e) {
    e.preventDefault();

    try {
      setError("");
      setMensaje("");
      setUrlResetDesarrollo("");

      const data = await solicitarRecuperacionPassword(email);

      setMensaje(data.mensaje);

      if (data.url_reset_desarrollo) {
        setUrlResetDesarrollo(data.url_reset_desarrollo);
      }
    } catch (err) {
      setError(err.message);
    }
  }

  async function manejarResetPassword(e) {
    e.preventDefault();

    try {
      setError("");
      setMensaje("");

      const data = await resetearPasswordConToken(resetToken, nuevaPassword);

      setMensaje(data.mensaje);
      setNuevaPassword("");
      setResetToken("");
      setModoRecuperacion(false);

      window.history.replaceState({}, document.title, window.location.pathname);
    } catch (err) {
      setError(err.message);
    }
  }

  function volverLogin() {
    setModoRecuperacion(false);
    setResetToken("");
    setNuevaPassword("");
    setMensaje("");
    setError("");
    setUrlResetDesarrollo("");
    window.history.replaceState({}, document.title, window.location.pathname);
  }

  return (
    <div style={contenedor}>
      <div style={tarjeta}>
        <img style={logo} src={LOGO_SRC} alt="ServContable" />
        <h1 style={titulo}>ServContable PRO</h1>
        <p style={subtitulo}>
          {resetToken
            ? "Define una nueva contraseña"
            : modoRecuperacion
            ? "Recuperación segura de acceso"
            : "Ingreso seguro al sistema"}
        </p>

        {resetToken ? (
          <form onSubmit={manejarResetPassword} style={formulario}>
            <div>
              <label style={label}>Nueva contraseña</label>
              <input
                style={input}
                type="password"
                value={nuevaPassword}
                onChange={(e) => setNuevaPassword(e.target.value)}
                placeholder="Mínimo 8 caracteres"
                autoComplete="new-password"
              />
            </div>

            <button style={botonPrimario} type="submit">
              Actualizar contraseña
            </button>
          </form>
        ) : modoRecuperacion ? (
          <form onSubmit={manejarSolicitudRecuperacion} style={formulario}>
            <p style={textoAyuda}>
              Ingresa tu correo y enviaremos un enlace temporal para crear una
              nueva contraseña.
            </p>

            <div>
              <label style={label}>Correo electrónico</label>
              <input
                style={input}
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="correo@empresa.cl"
                autoComplete="username"
              />
            </div>

            <button style={botonPrimario} type="submit">
              Enviar instrucciones
            </button>
          </form>
        ) : (
          <>
            <form onSubmit={manejarLogin} style={formulario}>
              <div>
                <label style={label}>Correo electrónico</label>
                <input
                  style={permiteDemo ? inputDeshabilitado : input}
                  type="email"
                  value={permiteDemo ? "demo@servcontable.cl" : email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="correo@empresa.cl"
                  autoComplete="username"
                  disabled={permiteDemo}
                />
              </div>

              <div>
                <label style={label}>Contraseña</label>
                <input
                  style={permiteDemo ? inputDeshabilitado : input}
                  type="password"
                  value={permiteDemo ? "demo-servcontable" : password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="********"
                  autoComplete="current-password"
                  disabled={permiteDemo}
                />
              </div>

              <button
                style={permiteDemo ? botonPrimarioDeshabilitado : botonPrimario}
                type="submit"
                disabled={permiteDemo}
              >
                Ingresar
              </button>
            </form>

            {!permiteDemo && (
              <button
                style={botonSecundario}
                type="button"
                onClick={() => {
                  setModoRecuperacion(true);
                  setError("");
                  setMensaje("");
                }}
              >
                Recuperar contraseña
              </button>
            )}

            {permiteDemo && (
              <button style={botonDemo} type="button" onClick={manejarDemo}>
                Ingresar a versión demo
              </button>
            )}

            {permiteRegistroPublico && (
              <button style={botonSecundario} onClick={irARegistro}>
                Crear una cuenta nueva
              </button>
            )}

            {!permiteRegistroPublico && (
              <p style={notaAcceso}>
                Los accesos son creados por el administrador del sistema.
              </p>
            )}
          </>
        )}

        {mensaje && <p style={mensajeOk}>{mensaje}</p>}
        {urlResetDesarrollo && (
          <a style={enlaceDev} href={urlResetDesarrollo}>
            Abrir enlace de prueba local
          </a>
        )}
        {error && <p style={mensajeError}>{error}</p>}

        {(modoRecuperacion || resetToken) && (
          <button style={botonSecundario} type="button" onClick={volverLogin}>
            Volver al ingreso
          </button>
        )}
      </div>
    </div>
  );
}

const contenedor = {
  minHeight: "100vh",
  background:
    "radial-gradient(circle at 78% 18%, rgba(34, 211, 238, 0.34), transparent 25%), linear-gradient(135deg, #07111f 0%, #075985 48%, #22d3ee 100%)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontFamily: "Arial, sans-serif",
  padding: "20px",
};

const tarjeta = {
  width: "100%",
  maxWidth: "430px",
  background: "rgba(255,255,255,0.96)",
  borderRadius: "26px",
  padding: "35px",
  boxShadow: "0 26px 70px rgba(7, 17, 31, 0.28)",
  border: "1px solid rgba(255,255,255,0.48)",
};

const logo = {
  width: "76px",
  height: "76px",
  borderRadius: "22px",
  objectFit: "contain",
  background: "linear-gradient(135deg, #dff7ff, #ffffff)",
  border: "1px solid #67e8f9",
  padding: "8px",
  boxSizing: "border-box",
  display: "block",
  margin: "0 auto 14px",
  boxShadow: "0 14px 30px rgba(15, 76, 129, 0.16)",
};

const titulo = {
  color: "#0369a1",
  fontSize: "32px",
  textAlign: "center",
  marginBottom: "5px",
};

const subtitulo = {
  color: "#475569",
  textAlign: "center",
  marginBottom: "25px",
};

const formulario = {
  display: "flex",
  flexDirection: "column",
  gap: "15px",
};

const label = {
  display: "block",
  marginBottom: "6px",
  color: "#1e293b",
  fontWeight: "bold",
  fontSize: "14px",
};

const input = {
  width: "100%",
  padding: "13px",
  borderRadius: "12px",
  border: "1px solid #a9d8ef",
  fontSize: "15px",
  boxSizing: "border-box",
};

const inputDeshabilitado = {
  ...input,
  background: "#e8f1ff",
  color: "#1e293b",
  cursor: "not-allowed",
  opacity: 0.86,
};

const botonPrimario = {
  background: "linear-gradient(135deg, #0369a1, #06b6d4)",
  color: "white",
  border: "none",
  padding: "14px",
  borderRadius: "12px",
  fontWeight: "bold",
  cursor: "pointer",
  marginTop: "10px",
};

const botonPrimarioDeshabilitado = {
  ...botonPrimario,
  background: "linear-gradient(135deg, #94a3b8, #cbd5e1)",
  cursor: "not-allowed",
  opacity: 0.9,
};

const botonDemo = {
  background: "linear-gradient(135deg, #ecfeff, #dff7ff)",
  color: "#0369a1",
  border: "2px solid #22d3ee",
  padding: "13px",
  borderRadius: "12px",
  fontWeight: "bold",
  cursor: "pointer",
  marginTop: "14px",
  width: "100%",
};

const botonSecundario = {
  background: "transparent",
  color: "#0369a1",
  border: "none",
  marginTop: "20px",
  width: "100%",
  cursor: "pointer",
  fontWeight: "bold",
};

const mensajeError = {
  marginTop: "15px",
  color: "#ef4444",
  fontWeight: "bold",
  textAlign: "center",
};

const mensajeOk = {
  marginTop: "15px",
  color: "#059669",
  fontWeight: "bold",
  textAlign: "center",
};

const textoAyuda = {
  margin: "0 0 4px",
  color: "#475569",
  fontSize: "13px",
  lineHeight: 1.45,
  textAlign: "center",
};

const enlaceDev = {
  display: "block",
  marginTop: "12px",
  color: "#0369a1",
  fontWeight: "bold",
  textAlign: "center",
  textDecoration: "none",
};

const notaAcceso = {
  marginTop: "20px",
  color: "#475569",
  textAlign: "center",
  fontSize: "13px",
};
