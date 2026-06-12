import { useMemo, useState } from "react";
import SessionHeader from "../components/SessionHeader";
import { obtenerSesionActualizada } from "../services/authService";
import { crearRenovacionFlow } from "../services/suscripcionService";

const PRECIO_MENSUAL_BASE = 16990;
const PRECIO_ANUAL_BASE_MENSUAL = 14990;
const PRECIO_USUARIO_ADICIONAL = 3990;
const IVA = 0.19;

const MESES = Array.from({ length: 12 }, (_, index) => index + 1);

function formatearCLP(valor) {
  return Number(valor || 0).toLocaleString("es-CL", {
    style: "currency",
    currency: "CLP",
    maximumFractionDigits: 0,
  });
}

function formatearFecha(fecha) {
  if (!fecha) return "sin fecha registrada";
  const [anio, mes, dia] = String(fecha).slice(0, 10).split("-");
  if (!anio || !mes || !dia) return fecha;
  return dia + "-" + mes + "-" + anio;
}

function calcularValores(plan, meses, usuariosAdicionales) {
  const mesesCobro = plan === "anual" ? 12 : Number(meses || 1);
  const base = plan === "anual"
    ? PRECIO_ANUAL_BASE_MENSUAL * 12
    : PRECIO_MENSUAL_BASE * mesesCobro;
  const usuarios = PRECIO_USUARIO_ADICIONAL * Number(usuariosAdicionales || 0) * mesesCobro;
  const neto = base + usuarios;
  const iva = Math.round(neto * IVA);

  return {
    mesesCobro,
    base,
    usuarios,
    neto,
    iva,
    total: neto + iva,
  };
}

function RenovarSuscripcion({
  usuario,
  alCerrarSesion,
  alSesionActualizada,
}) {
  const [mostrarAviso, setMostrarAviso] = useState(true);
  const [plan, setPlan] = useState(usuario?.suscripcion?.plan || "mensual");
  const [meses, setMeses] = useState(1);
  const [usuariosAdicionales, setUsuariosAdicionales] = useState(
    usuario?.suscripcion?.usuarios_adicionales || 0
  );
  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);

  const valores = useMemo(
    () => calcularValores(plan, meses, usuariosAdicionales),
    [plan, meses, usuariosAdicionales]
  );

  async function pagarFlow() {
    setError("");
    setMensaje("Preparando pago en Flow...");
    setCargando(true);

    try {
      const correoUsuario = usuario?.email || usuario?.correo || "";
      const nombreUsuario = usuario?.nombre || correoUsuario || "Cliente ServContable";
      const data = await crearRenovacionFlow({
        nombre: nombreUsuario,
        correo: correoUsuario,
        plan,
        periodicidad: plan,
        meses: valores.mesesCobro,
        usuarios_adicionales: usuariosAdicionales,
        mensaje: `Renovacion de suscripcion ${plan}`,
      });

      const destino = data.checkout_url || data.url;

      if (!destino) {
        throw new Error("Flow no devolvio un enlace de pago.");
      }

      window.location.href = destino;
    } catch (err) {
      setError(err.message || "No se pudo iniciar el pago.");
      setMensaje("");
      setCargando(false);
    }
  }

  async function actualizarEstado() {
    setError("");
    setMensaje("Actualizando estado de la suscripciÃ³n...");

    try {
      const usuarioActualizado = await obtenerSesionActualizada();
      alSesionActualizada?.(usuarioActualizado);
      setMensaje("Estado actualizado correctamente.");
    } catch (err) {
      setError(err.message || "No se pudo actualizar el estado.");
      setMensaje("");
    }
  }

  function mostrarTransferencia() {
    setError("");
    setMensaje(
      "Para renovar por transferencia, escribe a ventas@servcontablepro.cl indicando tu correo de usuario y el plan elegido."
    );
  }

  const fechaVence = usuario?.suscripcion?.vence;

  return (
    <div className="sc-page-shell">
      <SessionHeader usuario={usuario} alCerrarSesion={alCerrarSesion} />

      {mostrarAviso && (
        <div className="sc-renewal-backdrop">
          <div className="sc-renewal-dialog">
            <div className="sc-renewal-question">?</div>
            <p>
              Tu suscripciÃ³n expirÃ³ el <strong>{formatearFecha(fechaVence)}</strong>.
              Â¿Deseas renovarla?
            </p>
            <div className="sc-actions-row">
              <button
                className="sc-btn sc-btn--primary"
                onClick={() => setMostrarAviso(false)}
              >
                Confirmar
              </button>
              <button
                className="sc-btn sc-btn--outline"
                onClick={alCerrarSesion}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      <main className="sc-renewal-content">
        <section className="serv-modulo-hero sc-renewal-hero">
          <div className="serv-modulo-hero__texto">
            <h1>Renovar suscripciÃ³n</h1>
            <p>
              Tu acceso estÃ¡ vencido. Renueva el plan para volver a utilizar los mÃ³dulos
              contables y de remuneraciones.
            </p>
          </div>
          <div className="sc-renewal-expiry">
            <span>Vencimiento</span>
            <strong>{formatearFecha(fechaVence)}</strong>
          </div>
        </section>

        <section className="sc-renewal-card">
          <div className="sc-renewal-grid">
            <label className="sc-field">
              <span className="sc-label">Plan</span>
              <select
                className="sc-input"
                value={plan}
                onChange={(event) => setPlan(event.target.value)}
              >
                <option value="mensual">Mensual: $16.990 + IVA / mes</option>
                <option value="anual">Anual: $14.990 + IVA x 12 meses</option>
              </select>
            </label>

            <label className="sc-field">
              <span className="sc-label">Meses a contratar</span>
              <select
                className="sc-input"
                value={plan === "anual" ? 12 : meses}
                disabled={plan === "anual"}
                onChange={(event) => setMeses(Number(event.target.value))}
              >
                {MESES.map((mes) => (
                  <option key={mes} value={mes}>
                    {mes} {mes === 1 ? "mes" : "meses"}
                  </option>
                ))}
              </select>
            </label>

            <label className="sc-field">
              <span className="sc-label">Usuarios adicionales</span>
              <input
                className="sc-input"
                type="number"
                min="0"
                value={usuariosAdicionales}
                onChange={(event) =>
                  setUsuariosAdicionales(Math.max(0, Number(event.target.value || 0)))
                }
              />
            </label>
          </div>

          <div className="sc-renewal-summary">
            <div>
              <span>Valor neto plan</span>
              <strong>{formatearCLP(valores.base)}</strong>
            </div>
            <div>
              <span>Usuarios adicionales</span>
              <strong>{formatearCLP(valores.usuarios)}</strong>
            </div>
            <div>
              <span>IVA 19%</span>
              <strong>{formatearCLP(valores.iva)}</strong>
            </div>
            <div className="sc-renewal-total">
              <span>Total a pagar</span>
              <strong>{formatearCLP(valores.total)}</strong>
            </div>
          </div>

          {plan === "anual" && (
            <p className="sc-renewal-note">
              Pago anual de una vez: 12 meses x $14.990 neto, mÃ¡s IVA.
            </p>
          )}

          <div className="sc-actions-row">
            <button
              className="sc-btn sc-btn--primary"
              onClick={pagarFlow}
              disabled={cargando}
            >
              Pagar con Flow
            </button>
            <button
              className="sc-btn sc-btn--outline"
              onClick={mostrarTransferencia}
              disabled={cargando}
            >
              Pagar con transferencia
            </button>
            <button
              className="sc-btn sc-btn--ghost"
              onClick={actualizarEstado}
              disabled={cargando}
            >
              Actualizar estado
            </button>
          </div>

          {mensaje && <p className="sc-message sc-message--ok">{mensaje}</p>}
          {error && <p className="sc-message sc-message--error">{error}</p>}
        </section>
      </main>
    </div>
  );
}

export default RenovarSuscripcion;

