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

  const tituloFormulario = resetToken
    ? "Nueva contraseña"
    : modoRecuperacion
    ? "Recuperar acceso"
    : "Ingreso seguro";

  const subtituloFormulario = resetToken
    ? "Define una contraseña nueva para volver a entrar al sistema."
    : modoRecuperacion
    ? "Te enviaremos un enlace temporal para crear una nueva contraseña."
    : "Accede a tu contabilidad, empresas y reportes desde un panel limpio.";

  return (
    <div className="sc-page-shell sc-page-shell--center">
      <div className="sc-auth-layout sc-auth-layout--single">
        <article className="sc-glass-card sc-login-card">
          <img className="sc-logo-mark sc-logo-mark--center" src={LOGO_SRC} alt="ServContable" />
          <h1 className="sc-card-title">ServContable PRO</h1>
          <p className="sc-card-subtitle">{subtituloFormulario}</p>

          {resetToken ? (
            <form onSubmit={manejarResetPassword} className="sc-form">
              <div className="sc-field">
                <label className="sc-label">Nueva contraseña</label>
                <input
                  className="sc-input"
                  type="password"
                  value={nuevaPassword}
                  onChange={(e) => setNuevaPassword(e.target.value)}
                  placeholder="Mínimo 8 caracteres"
                  autoComplete="new-password"
                />
              </div>

              <button className="sc-btn sc-btn--primary sc-btn--wide" type="submit">
                Actualizar contraseña
              </button>
            </form>
          ) : modoRecuperacion ? (
            <form onSubmit={manejarSolicitudRecuperacion} className="sc-form">
              <p className="sc-help-text">{tituloFormulario}</p>

              <div className="sc-field">
                <label className="sc-label">Correo electrónico</label>
                <input
                  className="sc-input"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="correo@empresa.cl"
                  autoComplete="username"
                />
              </div>

              <button className="sc-btn sc-btn--primary sc-btn--wide" type="submit">
                Enviar instrucciones
              </button>
            </form>
          ) : (
            <>
              <form onSubmit={manejarLogin} className="sc-form">
                <div className="sc-field">
                  <label className="sc-label">Correo electrónico</label>
                  <input
                    className="sc-input"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="correo@empresa.cl"
                    autoComplete="username"
                  />
                </div>

                <div className="sc-field">
                  <label className="sc-label">Contraseña</label>
                  <input
                    className="sc-input"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="********"
                    autoComplete="current-password"
                  />
                </div>

                <button className="sc-btn sc-btn--primary sc-btn--wide" type="submit">
                  Ingresar
                </button>
              </form>

              <button
                className="sc-btn sc-btn--ghost sc-btn--wide"
                type="button"
                onClick={() => {
                  setModoRecuperacion(true);
                  setError("");
                  setMensaje("");
                }}
              >
                Recuperar contraseña
              </button>

              {permiteDemo && (
                <button className="sc-btn sc-btn--demo sc-btn--wide" type="button" onClick={manejarDemo}>
                  Ingresar a versión demo
                </button>
              )}

              {permiteRegistroPublico && (
                <button className="sc-btn sc-btn--outline sc-btn--wide" type="button" onClick={irARegistro}>
                  Crear una cuenta nueva
                </button>
              )}

              {!permiteRegistroPublico && (
                <p className="sc-access-note">
                  Los accesos son creados por el administrador del sistema.
                </p>
              )}
            </>
          )}

          {mensaje && <p className="sc-message sc-message--ok">{mensaje}</p>}
          {urlResetDesarrollo && (
            <a className="sc-dev-link" href={urlResetDesarrollo}>
              Abrir enlace de prueba local
            </a>
          )}
          {error && <p className="sc-message sc-message--error">{error}</p>}

          {(modoRecuperacion || resetToken) && (
            <button className="sc-btn sc-btn--ghost sc-btn--wide" type="button" onClick={volverLogin}>
              Volver al ingreso
            </button>
          )}
        </article>
      </div>
    </div>
  );
}
