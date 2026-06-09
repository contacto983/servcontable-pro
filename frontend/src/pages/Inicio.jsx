import { useEffect, useMemo, useState } from "react";
import {
  crearPreferenciaMercadoPago,
  obtenerEstadoContratacion,
} from "../services/contratacionService";

const LOGO_SRC = "/servcontable-logo.png";
const DEMO_URL = import.meta.env.VITE_DEMO_URL || "https://demo.servcontablepro.cl";
const APP_URL = import.meta.env.VITE_APP_URL || "https://app.servcontablepro.cl";
const WHATSAPP_URL = "https://wa.me/56977089069?text=Hola%2C%20quiero%20contratar%20ServContable%20PRO";

const PRECIOS = {
  mensual: { etiqueta: "Mensual", neto: 16990, descripcion: "+ IVA / mes" },
  anual: {
    etiqueta: "Anual",
    neto: 14990,
    descripcion: "+ IVA / mes",
    nota: "Pago anual de una vez: 12 meses x $14.990 = $179.880 + IVA.",
  },
};

function formatearCLP(valor) {
  return new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    maximumFractionDigits: 0,
  }).format(Number(valor || 0));
}

function obtenerResultadoPago() {
  const path = window.location.pathname;
  if (path.includes("pago-exitoso")) return "exito";
  if (path.includes("pago-pendiente")) return "pendiente";
  if (path.includes("pago-error")) return "error";
  return "";
}

export default function Inicio() {
  const [periodicidad, setPeriodicidad] = useState("mensual");
  const [formulario, setFormulario] = useState({
    nombre: "",
    correo: "",
    telefono: "",
    rut: "",
    empresa: "",
    aceptaTerminos: false,
  });
  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);
  const [estadoPago, setEstadoPago] = useState(null);

  const resultadoPago = obtenerResultadoPago();

  const totalSeleccionado = useMemo(() => {
    const neto =
      periodicidad === "anual" ? PRECIOS.anual.neto * 12 : PRECIOS.mensual.neto;
    const iva = Math.round(neto * 0.19);
    return { neto, iva, total: neto + iva };
  }, [periodicidad]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const contratacionId = params.get("contratacion");

    if (!contratacionId) return;

    obtenerEstadoContratacion(contratacionId)
      .then(setEstadoPago)
      .catch(() => setEstadoPago(null));
  }, []);

  function cambiarCampo(campo, valor) {
    setFormulario((actual) => ({ ...actual, [campo]: valor }));
  }

  function irAContratacion(tipo = periodicidad) {
    setPeriodicidad(tipo);
    setMensaje("");
    setError("");
    document
      .getElementById("contratar")
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  async function contratar(e) {
    e.preventDefault();

    try {
      setCargando(true);
      setMensaje("Creando link seguro de pago...");
      setError("");

      const data = await crearPreferenciaMercadoPago({
        ...formulario,
        periodicidad,
        acepta_terminos: formulario.aceptaTerminos,
      });

      const linkPago = data.init_point || data.sandbox_init_point;

      if (!linkPago) {
        throw new Error("Mercado Pago no devolvio un link de pago.");
      }

      window.location.href = linkPago;
    } catch (err) {
      setError(err.message);
      setMensaje("");
    } finally {
      setCargando(false);
    }
  }

  return (
    <div style={pagina}>
      <header style={hero}>
        <div style={marcaFila}>
          <img src={LOGO_SRC} alt="ServContable PRO" style={logo} />
          <div>
            <strong style={marca}>ServContable PRO</strong>
            <span style={subMarca}>Contabilidad y remuneraciones en la nube</span>
          </div>
        </div>

        <nav style={accionesTop}>
          <button
            style={botonClaro}
            type="button"
            onClick={() => window.open(DEMO_URL, "_blank", "noopener,noreferrer")}
          >
            Probar demo
          </button>
          <button
            style={botonPrincipalMini}
            type="button"
            onClick={() => irAContratacion("mensual")}
          >
            Contratar plan
          </button>
          <button
            style={botonTexto}
            type="button"
            onClick={() => {
              window.location.href = APP_URL;
            }}
          >
            Ingresar
          </button>
        </nav>
      </header>

      {resultadoPago && (
        <section style={avisoPago(resultadoPago)}>
          <strong>
            {resultadoPago === "exito" && "Pago recibido"}
            {resultadoPago === "pendiente" && "Pago pendiente"}
            {resultadoPago === "error" && "Pago no completado"}
          </strong>
          <span>
            {resultadoPago === "exito" &&
              "Tu contratacion quedara activa cuando Mercado Pago confirme el webhook."}
            {resultadoPago === "pendiente" &&
              "Estamos esperando la confirmacion de Mercado Pago."}
            {resultadoPago === "error" &&
              "Puedes intentar nuevamente o escribirnos por WhatsApp."}
          </span>
          {estadoPago && <small>Estado interno: {estadoPago.estado}</small>}
        </section>
      )}

      <main style={contenido}>
        <section style={bloqueIntro}>
          <span style={pill}>Sistema PRO para pymes y estudios contables</span>
          <h1 style={titulo}>
            Ordena contabilidad, impuestos y remuneraciones en una sola plataforma.
          </h1>
          <p style={bajada}>
            Demo disponible para revisar el flujo. La contratacion se paga por
            Mercado Pago y el plan queda registrado para activacion.
          </p>

          <div style={botonesHero}>
            <button
              style={botonPrincipal}
              type="button"
              onClick={() => irAContratacion("mensual")}
            >
              Contratar plan
            </button>
            <button
              style={botonSecundario}
              type="button"
              onClick={() => window.open(DEMO_URL, "_blank", "noopener,noreferrer")}
            >
              Ver demo
            </button>
          </div>
        </section>

        <section style={panelPlan}>
          <span style={pillSuave}>Plan unico</span>
          <h2 style={tituloPlan}>Contratacion PRO</h2>
          <p style={textoPlan}>Plan multiempresa con 1 usuario incluido.</p>

          <div style={precioGrid}>
            <button
              type="button"
              style={tarjetaPrecio(periodicidad === "mensual")}
              onClick={() => setPeriodicidad("mensual")}
            >
              <strong>Mensual</strong>
              <span>{formatearCLP(PRECIOS.mensual.neto)}</span>
              <small>+ IVA / mes</small>
            </button>

            <button
              type="button"
              style={tarjetaPrecio(periodicidad === "anual")}
              onClick={() => setPeriodicidad("anual")}
            >
              <strong>Anual</strong>
              <span>{formatearCLP(PRECIOS.anual.neto)}</span>
              <small>+ IVA / mes</small>
            </button>
          </div>

          <div style={notaAnual}>{PRECIOS.anual.nota}</div>

          <ul style={listaPlan}>
            <li>Multiempresa incluido en el plan.</li>
            <li>1 usuario incluido.</li>
            <li>Usuario adicional: $3.990 + IVA mensual.</li>
            <li>Contabilidad, remuneraciones, Previred, libros e informes.</li>
          </ul>

          <button
            style={botonPrincipal}
            type="button"
            onClick={() => irAContratacion(periodicidad)}
          >
            Contratar plan
          </button>
        </section>
      </main>


      <section style={seccionWeb} id="problema">
        <h2 style={seccionTitulo}>Qué problema resuelve</h2>
        <p style={textoPlan}>ServContable PRO ordena contabilidad, remuneraciones e impuestos por empresa, año de trabajo y usuario.</p>
        <div style={gridWeb3}>
          <MiniCard titulo="Menos planillas" texto="Compras, ventas, comprobantes, liquidaciones y reportes quedan conectados." />
          <MiniCard titulo="Control por cliente" texto="Cada cliente administra sus empresas y el administrador revisa accesos, pagos y solicitudes." />
          <MiniCard titulo="Reportes listos" texto="Libros, balances, IVA, F29, liquidaciones y finiquitos salen con formato compacto." />
        </div>
      </section>

      <section style={seccionWeb} id="funciones">
        <h2 style={seccionTitulo}>Funciones principales</h2>
        <div style={gridWeb4}>
          <MiniCard titulo="Contabilidad" texto="Comprobantes, compras, ventas, libro diario, mayor, balance y resultado." />
          <MiniCard titulo="Tributario" texto="Resumen IVA, F29 estimado, retenciones y control de remanente." />
          <MiniCard titulo="Remuneraciones" texto="Trabajadores, haberes, descuentos, liquidaciones, pagos y Previred." />
          <MiniCard titulo="Gestión" texto="Empresas, usuarios, auditoría, demo y solicitudes web." />
        </div>
      </section>

      <section style={seccionWeb} id="demo">
        <h2 style={seccionTitulo}>Demo</h2>
        <div style={demoLegalBox}>
          <p style={textoPlan}>El demo es individual por cliente: el interesado solicita acceso con su correo, el administrador lo activa por 30 días y queda limitado a 1 empresa.</p>
          <p style={textoPlan}>Al vencer, el sistema bloquea el ingreso demo y muestra un mensaje para solicitar renovación o contratar el plan.</p>
          <button style={botonPrincipalMini} type="button" onClick={() => window.open(DEMO_URL, "_blank", "noopener,noreferrer")}>Solicitar demo</button>
        </div>
      </section>

      <section style={seccionWeb} id="faq">
        <h2 style={seccionTitulo}>Preguntas frecuentes</h2>
        <div style={gridWeb2}>
          <Pregunta titulo="¿El plan es multiempresa?" texto="Sí. El plan PRO es multiempresa e incluye 1 usuario." />
          <Pregunta titulo="¿Cuánto dura el demo?" texto="30 días desde la activación del administrador, con límite de 1 empresa." />
          <Pregunta titulo="¿Cómo se activa el plan?" texto="Mercado Pago confirma el pago por webhook y el sistema registra la contratación para habilitar el acceso." />
          <Pregunta titulo="¿Cuánto cuesta un usuario adicional?" texto="$3.990 + IVA mensual por usuario adicional." />
        </div>
      </section>

      <section style={seccionWeb} id="legales">
        <h2 style={seccionTitulo}>Términos y condiciones, privacidad y seguridad</h2>
        <div style={gridWeb4}>
          <MiniCard titulo="Términos y condiciones" texto="Servicio SaaS de suscripción mensual o anual. El cliente debe ingresar información fidedigna y revisar sus reportes." />
          <MiniCard titulo="Política de privacidad" texto="Los datos se usan para contratación, activación, facturación, soporte y comunicaciones del servicio." />
          <MiniCard titulo="Seguridad" texto="Acceso autenticado, roles de usuario, separación por empresa y bloqueo automático de demos vencidas." />
          <MiniCard titulo="Retracto" texto="La contratación online informa precio, IVA y condiciones. El derecho a retracto se aplicará cuando corresponda según normativa vigente." />
        </div>
      </section>

      <section style={seccionWeb} id="datos-empresa">
        <h2 style={seccionTitulo}>Datos de empresa</h2>
        <div style={datosEmpresaBox}>
          <LineaResumen label="Web" valor="www.servcontablepro.cl" />
          <LineaResumen label="Aplicación" valor="app.servcontablepro.cl" />
          <LineaResumen label="Demo" valor="demo.servcontablepro.cl" />
          <LineaResumen label="Contacto" valor="contacto@servcontablepro.cl" />
          <LineaResumen label="WhatsApp" valor="+56977089069" />
          <LineaResumen label="Razón social / RUT" valor="Completar datos de la empresa emisora en producción" />
        </div>
      </section>
      <section id="contratar" style={checkout}>
        <div style={checkoutFormCard}>
          <span style={pill}>Checkout seguro</span>
          <h2 style={seccionTitulo}>Datos de contratacion</h2>
          <p style={textoPlan}>
            Completa los datos para crear el link de pago en Mercado Pago.
          </p>

          <form style={formularioEstilo} onSubmit={contratar}>
            <div style={gridForm}>
              <Campo
                label="Nombre"
                value={formulario.nombre}
                onChange={(valor) => cambiarCampo("nombre", valor)}
                required
              />
              <Campo
                label="Correo electronico"
                type="email"
                value={formulario.correo}
                onChange={(valor) => cambiarCampo("correo", valor)}
                required
              />
              <Campo
                label="Telefono"
                value={formulario.telefono}
                onChange={(valor) => cambiarCampo("telefono", valor)}
              />
              <Campo
                label="RUT"
                value={formulario.rut}
                onChange={(valor) => cambiarCampo("rut", valor)}
              />
              <Campo
                label="Empresa"
                value={formulario.empresa}
                onChange={(valor) => cambiarCampo("empresa", valor)}
              />
              <label style={campoCompacto}>
                <span>Periodicidad</span>
                <select
                  style={input}
                  value={periodicidad}
                  onChange={(e) => setPeriodicidad(e.target.value)}
                >
                  <option value="mensual">Mensual</option>
                  <option value="anual">Anual</option>
                </select>
              </label>
            </div>

            <details style={legalBox}>
              <summary style={legalSummary}>Terminos, privacidad y seguridad</summary>
              <div style={legalTexto}>
                <p>
                  Al contratar aceptas el uso de ServContable PRO como software de
                  gestion contable y remuneraciones bajo modalidad de suscripcion.
                  El cliente es responsable de ingresar informacion fidedigna y
                  resguardar sus credenciales.
                </p>
                <p>
                  Los datos se usan para prestar el servicio, administrar pagos,
                  soporte y activacion del plan. El sistema opera con acceso
                  autenticado, control de sesiones, perfiles de usuario y respaldo
                  de la informacion en la infraestructura contratada.
                </p>
              </div>
            </details>

            <label style={aceptacionBox}>
              <input
                type="checkbox"
                checked={formulario.aceptaTerminos}
                onChange={(e) => cambiarCampo("aceptaTerminos", e.target.checked)}
              />
              <span>
                Acepto las condiciones de contratacion, privacidad y seguridad de
                ServContable PRO.
              </span>
            </label>

            {mensaje && <p style={mensajeOk}>{mensaje}</p>}
            {error && <p style={mensajeError}>{error}</p>}

            <button style={botonPago} type="submit" disabled={cargando}>
              {cargando ? "Creando link..." : "Pagar con Mercado Pago"}
            </button>
          </form>
        </div>

        <aside style={resumenPedido}>
          <h3 style={resumenTitulo}>Resumen del pedido</h3>
          <LineaResumen
            label={`Plan PRO ${periodicidad}`}
            valor={formatearCLP(totalSeleccionado.neto)}
          />
          <LineaResumen label="IVA 19%" valor={formatearCLP(totalSeleccionado.iva)} />
          <div style={totalFila}>
            <strong>Total</strong>
            <strong>{formatearCLP(totalSeleccionado.total)}</strong>
          </div>
          <p style={resumenNota}>
            WhatsApp soporte: +56977089069. Atencion de lunes a viernes.
          </p>
        </aside>
      </section>
    </div>
  );
}

function Campo({ label, value, onChange, type = "text", required = false }) {
  return (
    <label style={campoCompacto}>
      <span>{label}</span>
      <input
        style={input}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
      />
    </label>
  );
}

function LineaResumen({ label, valor }) {
  return (
    <div style={lineaResumen}>
      <span>{label}</span>
      <strong>{valor}</strong>
    </div>
  );
}


function MiniCard({ titulo, texto }) {
  return (
    <article style={miniCard}>
      <strong>{titulo}</strong>
      <p>{texto}</p>
    </article>
  );
}

function Pregunta({ pregunta, respuesta }) {
  return (
    <details style={preguntaCard}>
      <summary>{pregunta}</summary>
      <p>{respuesta}</p>
    </details>
  );
}

const pagina = {
  minHeight: "100vh",
  background:
    "radial-gradient(circle at 78% 12%, rgba(34, 211, 238, 0.22), transparent 28%), linear-gradient(135deg, #f8fdff 0%, #e8f8ff 100%)",
  color: "#061529",
  fontFamily: "Arial, sans-serif",
  padding: "18px",
};

const hero = {
  maxWidth: "1160px",
  margin: "0 auto 18px",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: "14px",
};

const marcaFila = { display: "flex", alignItems: "center", gap: "10px" };
const logo = {
  width: "48px",
  height: "48px",
  borderRadius: "14px",
  objectFit: "contain",
  border: "1px solid #67e8f9",
  background: "white",
  padding: "5px",
};
const marca = { display: "block", color: "#0369a1", fontSize: "20px" };
const subMarca = { display: "block", color: "#48657a", fontSize: "12px" };
const accionesTop = {
  display: "flex",
  gap: "8px",
  flexWrap: "wrap",
  justifyContent: "flex-end",
};

const contenido = {
  maxWidth: "1160px",
  margin: "0 auto",
  display: "grid",
  gridTemplateColumns: "1.1fr 0.9fr",
  gap: "18px",
  alignItems: "stretch",
};

const bloqueIntro = {
  background: "linear-gradient(135deg, #07111f 0%, #075985 56%, #06b6d4 100%)",
  color: "white",
  borderRadius: "24px",
  padding: "34px",
  boxShadow: "0 22px 45px rgba(8, 47, 73, 0.18)",
};

const pill = {
  display: "inline-flex",
  background: "rgba(255,255,255,0.16)",
  color: "inherit",
  border: "1px solid rgba(255,255,255,0.24)",
  borderRadius: "999px",
  padding: "6px 10px",
  fontWeight: 800,
  fontSize: "12px",
};
const titulo = { fontSize: "36px", lineHeight: 1.05, margin: "20px 0 12px" };
const bajada = {
  fontSize: "16px",
  lineHeight: 1.55,
  color: "#dff7ff",
  maxWidth: "660px",
};
const botonesHero = { display: "flex", gap: "10px", marginTop: "24px", flexWrap: "wrap" };

const panelPlan = {
  background: "rgba(255,255,255,0.95)",
  border: "1px solid #bae6fd",
  borderRadius: "22px",
  padding: "24px",
  boxShadow: "0 18px 42px rgba(8, 47, 73, 0.12)",
};

const pillSuave = {
  ...pill,
  background: "#e0f2fe",
  color: "#0369a1",
  borderColor: "#bae6fd",
};
const tituloPlan = { color: "#075985", fontSize: "26px", margin: "16px 0 8px" };
const textoPlan = { color: "#426176", margin: "0 0 14px", lineHeight: 1.45 };
const precioGrid = { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" };
const notaAnual = {
  background: "#ecfdf5",
  color: "#047857",
  border: "1px solid #86efac",
  borderRadius: "12px",
  padding: "12px",
  fontWeight: 800,
  marginTop: "12px",
};
const listaPlan = { color: "#24445c", lineHeight: 1.8, paddingLeft: "20px", margin: "14px 0" };

const tarjetaPrecio = (activa) => ({
  textAlign: "left",
  border: activa ? "2px solid #06b6d4" : "1px solid #bae6fd",
  background: activa ? "#ecfeff" : "#f0f9ff",
  borderRadius: "14px",
  padding: "14px",
  color: "#064d7a",
  cursor: "pointer",
  display: "flex",
  flexDirection: "column",
  gap: "4px",
});

const checkout = {
  maxWidth: "1160px",
  margin: "18px auto 0",
  display: "grid",
  gridTemplateColumns: "1.35fr 0.65fr",
  gap: "18px",
  alignItems: "start",
};

const checkoutFormCard = { ...panelPlan, padding: "22px" };
const seccionTitulo = { color: "#075985", fontSize: "24px", margin: "12px 0 8px" };
const formularioEstilo = { display: "flex", flexDirection: "column", gap: "12px" };
const gridForm = { display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: "10px" };
const campoCompacto = {
  display: "flex",
  flexDirection: "column",
  gap: "5px",
  color: "#102238",
  fontWeight: 800,
  fontSize: "13px",
};
const input = {
  border: "1px solid #9bdcf7",
  borderRadius: "12px",
  padding: "11px 12px",
  fontSize: "14px",
  outlineColor: "#06b6d4",
  background: "white",
};
const legalBox = {
  background: "#f8fafc",
  border: "1px solid #dbeafe",
  borderRadius: "14px",
  padding: "10px 12px",
};
const legalSummary = { cursor: "pointer", color: "#075985", fontWeight: 900 };
const legalTexto = { color: "#48657a", fontSize: "13px", lineHeight: 1.45 };
const aceptacionBox = {
  display: "flex",
  gap: "10px",
  alignItems: "flex-start",
  background: "#ecfeff",
  border: "1px solid #67e8f9",
  borderRadius: "14px",
  padding: "12px",
  color: "#083344",
  fontWeight: 800,
};
const resumenPedido = { ...panelPlan, position: "sticky", top: "12px" };
const resumenTitulo = { color: "#075985", marginTop: 0 };
const lineaResumen = {
  display: "flex",
  justifyContent: "space-between",
  borderBottom: "1px solid #dbeafe",
  padding: "10px 0",
  gap: "12px",
};
const totalFila = {
  display: "flex",
  justifyContent: "space-between",
  fontSize: "20px",
  color: "#075985",
  padding: "16px 0",
  borderBottom: "1px solid #dbeafe",
};
const resumenNota = { color: "#48657a", fontSize: "13px", lineHeight: 1.4 };

const botonBase = {
  border: "none",
  borderRadius: "12px",
  fontWeight: 900,
  cursor: "pointer",
  padding: "12px 16px",
};
const botonPrincipal = {
  ...botonBase,
  background: "linear-gradient(135deg, #0369a1, #06b6d4)",
  color: "white",
  boxShadow: "0 12px 24px rgba(6, 182, 212, 0.22)",
};
const botonPrincipalMini = { ...botonPrincipal, padding: "10px 14px" };
const botonSecundario = {
  ...botonBase,
  background: "white",
  color: "#0369a1",
  border: "1px solid #7dd3fc",
};
const botonClaro = {
  ...botonBase,
  background: "#e0f2fe",
  color: "#075985",
  border: "1px solid #bae6fd",
  padding: "10px 14px",
};
const botonTexto = { ...botonBase, background: "transparent", color: "#075985", padding: "10px" };
const botonPago = { ...botonPrincipal, width: "100%", fontSize: "15px" };
const mensajeOk = { color: "#059669", fontWeight: 900, margin: 0 };
const mensajeError = { color: "#ef4444", fontWeight: 900, margin: 0 };

const avisoPago = (tipo) => ({
  maxWidth: "1160px",
  margin: "0 auto 14px",
  display: "flex",
  flexDirection: "column",
  gap: "4px",
  background: tipo === "error" ? "#fef2f2" : tipo === "pendiente" ? "#fffbeb" : "#ecfdf5",
  border: `1px solid ${
    tipo === "error" ? "#fecaca" : tipo === "pendiente" ? "#fde68a" : "#86efac"
  }`,
  color: tipo === "error" ? "#991b1b" : tipo === "pendiente" ? "#92400e" : "#047857",
  borderRadius: "14px",
  padding: "12px 14px",
});



const seccionWeb = { maxWidth: "1160px", margin: "18px auto 0", padding: "22px", background: "white", border: "1px solid #bae6fd", borderRadius: "22px", boxShadow: "0 18px 38px rgba(8, 47, 73, 0.08)" };
const gridWeb2 = { display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: "14px", marginTop: "12px" };
const gridWeb3 = { display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: "14px", marginTop: "12px" };
const gridWeb4 = { display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: "14px", marginTop: "12px" };
const miniCard = { background: "#f8fafc", border: "1px solid #dbeafe", borderRadius: "16px", padding: "14px", color: "#102238", lineHeight: 1.45 };
const preguntaCard = { background: "#f8fafc", border: "1px solid #dbeafe", borderRadius: "16px", padding: "14px", color: "#102238", lineHeight: 1.45 };
const demoLegalBox = { background: "#ecfeff", border: "1px solid #67e8f9", borderRadius: "16px", padding: "14px", color: "#083344", fontWeight: 800 };
const datosEmpresaBox = { background: "#f0f9ff", border: "1px solid #bae6fd", borderRadius: "16px", padding: "14px", color: "#075985", lineHeight: 1.5 };
const botonWhatsapp = { ...botonBase, textDecoration: "none", background: "#22c55e", color: "white", display: "inline-flex", alignItems: "center", justifyContent: "center" };
