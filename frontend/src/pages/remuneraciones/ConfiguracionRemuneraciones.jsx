import { useEffect, useState } from "react";
import { obtenerEmpresaActiva } from "../../services/empresaService";
import { listarCuentas } from "../../services/cuentaService";
import { obtenerPeriodoTrabajo } from "../../services/periodoTrabajoService";
import PeriodoMesSelector from "../../components/PeriodoMesSelector";
import IconoSistema from "../../components/IconoSistema";
import {
  obtenerConfiguracionRemuneraciones,
  guardarConfiguracionRemuneraciones,
  guardarAFP,
  eliminarAFP,
  copiarConfiguracionRemuneracionesPeriodo,
} from "../../services/configuracionRemuneracionesService";

const MUTUALES_PREVIRED = [
  { codigo: "0", nombre: "Sin Mutual / ISL" },
  { codigo: "1", nombre: "Asociacion Chilena de Seguridad (ACHS)" },
  { codigo: "2", nombre: "Mutual de Seguridad CCHC" },
  { codigo: "3", nombre: "Instituto de Seguridad del Trabajo (IST)" },
];

function numeroConfig(valor) {
  const n = Number(String(valor || 0).replace(",", "."));
  return Number.isFinite(n) ? n : 0;
}

function mutualConfigDesdeDatos(datos = {}) {
  const codigoActual = String(datos.mutual_codigo_previred ?? "").trim();
  const tasaMutual = numeroConfig(datos.tasa_mutual);
  const codigo =
    codigoActual && (codigoActual !== "0" || tasaMutual === 0)
      ? codigoActual
      : tasaMutual > 0
        ? "1"
        : "0";
  const opcion =
    MUTUALES_PREVIRED.find((item) => item.codigo === codigo) ||
    MUTUALES_PREVIRED[0];

  return {
    mutual_nombre: datos.mutual_nombre || opcion.nombre,
    mutual_codigo_previred: opcion.codigo,
    mutual_sucursal_previred: datos.mutual_sucursal_previred || "0",
  };
}

export default function ConfiguracionRemuneraciones() {
  const empresaActiva = obtenerEmpresaActiva();

  const [periodo, setPeriodo] = useState(obtenerPeriodoTrabajo());
  const [periodoOrigen, setPeriodoOrigen] = useState(periodo);
  const [periodoDestino, setPeriodoDestino] = useState(periodo);

  const [cuentas, setCuentas] = useState([]);
  const [afps, setAfps] = useState([]);

  const [config, setConfig] = useState({
    tasa_salud: 7,
    tasa_sis: 0,
    tasa_afc_trabajador: 0,
    tasa_afc_empleador: 0,
    tasa_mutual: 0,
    ...mutualConfigDesdeDatos(),

    tope_imponible_uf: 0,
    valor_uf: 0,
    ingreso_minimo: 0,

    tramo_asignacion_a: 0,
    tramo_asignacion_b: 0,
    tramo_asignacion_c: 0,

    cuenta_sueldos_id: "",
    cuenta_afp_id: "",
    cuenta_salud_id: "",
    cuenta_afc_id: "",
    cuenta_mutual_id: "",
    cuenta_sueldos_por_pagar_id: "",
    cuenta_banco_pago_id: "",
    cuenta_impuesto_unico_id: "",
    cuenta_sis_empleador_id: "",
    cuenta_afc_empleador_id: "",
    cuenta_mutual_empleador_id: "",
    cuenta_otros_descuentos_id: "",
  });

  const [afpForm, setAfpForm] = useState({
    nombre: "",
    tasa_afp: "",
    tasa_sis: "",
    tasa_seguro_social: "1.00",
  });

  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (empresaActiva) {
      cargarDatos(periodo);
    }
  }, []);

  useEffect(() => {
    setPeriodoDestino(periodo);
  }, [periodo]);

  async function cargarDatos(periodoConsulta = periodo) {
    try {
      setMensaje("");
      setError("");

      const cuentasData = await listarCuentas(empresaActiva.id);
      setCuentas(cuentasData.cuentas || []);

      const data = await obtenerConfiguracionRemuneraciones(
        empresaActiva.id,
        periodoConsulta
      );

      setAfps(data.afps || []);

      if (data.configuracion) {
        const mutual = mutualConfigDesdeDatos(data.configuracion);

        setConfig({
          tasa_salud: data.configuracion.tasa_salud || 7,
          tasa_sis: data.configuracion.tasa_sis || 0,
          tasa_afc_trabajador: data.configuracion.tasa_afc_trabajador || 0,
          tasa_afc_empleador: data.configuracion.tasa_afc_empleador || 0,
          tasa_mutual: data.configuracion.tasa_mutual || 0,
          ...mutual,

          tope_imponible_uf: data.configuracion.tope_imponible_uf || 0,
          valor_uf: data.configuracion.valor_uf || 0,
          ingreso_minimo: data.configuracion.ingreso_minimo || 0,

          tramo_asignacion_a: data.configuracion.tramo_asignacion_a || 0,
          tramo_asignacion_b: data.configuracion.tramo_asignacion_b || 0,
          tramo_asignacion_c: data.configuracion.tramo_asignacion_c || 0,

          cuenta_sueldos_id: data.configuracion.cuenta_sueldos_id || "",
          cuenta_afp_id: data.configuracion.cuenta_afp_id || "",
          cuenta_salud_id: data.configuracion.cuenta_salud_id || "",
          cuenta_afc_id: data.configuracion.cuenta_afc_id || "",
          cuenta_mutual_id: data.configuracion.cuenta_mutual_id || "",
          cuenta_sueldos_por_pagar_id:
            data.configuracion.cuenta_sueldos_por_pagar_id || "",
          cuenta_banco_pago_id: data.configuracion.cuenta_banco_pago_id || "",
          cuenta_impuesto_unico_id:
            data.configuracion.cuenta_impuesto_unico_id || "",
          cuenta_sis_empleador_id:
            data.configuracion.cuenta_sis_empleador_id || "",
          cuenta_afc_empleador_id:
            data.configuracion.cuenta_afc_empleador_id || "",
          cuenta_mutual_empleador_id:
            data.configuracion.cuenta_mutual_empleador_id || "",
          cuenta_otros_descuentos_id:
            data.configuracion.cuenta_otros_descuentos_id || "",
        });
      } else {
        limpiarConfig();
      }
    } catch (err) {
      setError(err.message);
    }
  }

  function limpiarConfig() {
    setConfig({
      tasa_salud: 7,
      tasa_sis: 0,
      tasa_afc_trabajador: 0,
      tasa_afc_empleador: 0,
      tasa_mutual: 0,
      ...mutualConfigDesdeDatos(),

      tope_imponible_uf: 0,
      valor_uf: 0,
      ingreso_minimo: 0,

      tramo_asignacion_a: 0,
      tramo_asignacion_b: 0,
      tramo_asignacion_c: 0,

      cuenta_sueldos_id: "",
      cuenta_afp_id: "",
      cuenta_salud_id: "",
      cuenta_afc_id: "",
      cuenta_mutual_id: "",
      cuenta_sueldos_por_pagar_id: "",
      cuenta_banco_pago_id: "",
      cuenta_impuesto_unico_id: "",
      cuenta_sis_empleador_id: "",
      cuenta_afc_empleador_id: "",
      cuenta_mutual_empleador_id: "",
      cuenta_otros_descuentos_id: "",
    });
  }

  function cambiarPeriodo(nuevoPeriodo) {
    setPeriodo(nuevoPeriodo);
    setPeriodoDestino(nuevoPeriodo);
  }

  function cambiarConfig(e) {
    const { name, value } = e.target;

    if (name === "mutual_codigo_previred") {
      const opcion =
        MUTUALES_PREVIRED.find((item) => item.codigo === value) ||
        MUTUALES_PREVIRED[0];

      setConfig((prev) => ({
        ...prev,
        mutual_codigo_previred: opcion.codigo,
        mutual_nombre: opcion.nombre,
      }));
      return;
    }

    setConfig((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  function cambiarAfp(e) {
    const { name, value } = e.target;

    setAfpForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  async function guardarConfig(e) {
    e.preventDefault();

    try {
      setMensaje("");
      setError("");

      const data = await guardarConfiguracionRemuneraciones({
        empresa_id: empresaActiva.id,
        periodo,

        tasa_salud: Number(config.tasa_salud || 0),
        tasa_sis: Number(config.tasa_sis || 0),
        tasa_afc_trabajador: Number(config.tasa_afc_trabajador || 0),
        tasa_afc_empleador: Number(config.tasa_afc_empleador || 0),
        tasa_mutual: Number(config.tasa_mutual || 0),
        mutual_nombre: config.mutual_nombre || "",
        mutual_codigo_previred: config.mutual_codigo_previred || "0",
        mutual_sucursal_previred: config.mutual_sucursal_previred || "0",

        tope_imponible_uf: Number(config.tope_imponible_uf || 0),
        valor_uf: Number(config.valor_uf || 0),
        ingreso_minimo: Number(config.ingreso_minimo || 0),

        tramo_asignacion_a: Number(config.tramo_asignacion_a || 0),
        tramo_asignacion_b: Number(config.tramo_asignacion_b || 0),
        tramo_asignacion_c: Number(config.tramo_asignacion_c || 0),

        cuenta_sueldos_id: config.cuenta_sueldos_id || null,
        cuenta_afp_id: config.cuenta_afp_id || null,
        cuenta_salud_id: config.cuenta_salud_id || null,
        cuenta_afc_id: config.cuenta_afc_id || null,
        cuenta_mutual_id: config.cuenta_mutual_id || null,
        cuenta_sueldos_por_pagar_id:
          config.cuenta_sueldos_por_pagar_id || null,
        cuenta_banco_pago_id: config.cuenta_banco_pago_id || null,
        cuenta_impuesto_unico_id: config.cuenta_impuesto_unico_id || null,
        cuenta_sis_empleador_id: config.cuenta_sis_empleador_id || null,
        cuenta_afc_empleador_id: config.cuenta_afc_empleador_id || null,
        cuenta_mutual_empleador_id: config.cuenta_mutual_empleador_id || null,
        cuenta_otros_descuentos_id: config.cuenta_otros_descuentos_id || null,
      });

      setMensaje(data.mensaje);
      await cargarDatos(periodo);
    } catch (err) {
      setError(err.message);
    }
  }

  async function copiarDesdePeriodoAnterior() {
    try {
      setMensaje("");
      setError("");

      if (!periodoOrigen || !periodoDestino) {
        setError("Debes indicar periodo origen y periodo destino.");
        return;
      }

      if (periodoOrigen === periodoDestino) {
        setError("El periodo origen y destino no pueden ser iguales.");
        return;
      }

      const confirmar = window.confirm(
        `Seguro deseas copiar la configuracion desde ${periodoOrigen} hacia ${periodoDestino}?`
      );

      if (!confirmar) return;

      const data = await copiarConfiguracionRemuneracionesPeriodo({
        empresa_id: empresaActiva.id,
        periodo_origen: periodoOrigen,
        periodo_destino: periodoDestino,
      });

      setMensaje(`${data.mensaje}. AFP copiadas: ${data.afps_copiadas || 0}`);

      setPeriodo(periodoDestino);
      await cargarDatos(periodoDestino);
    } catch (err) {
      setError(err.message);
    }
  }

  async function guardarAfpSubmit(e) {
    e.preventDefault();

    try {
      setMensaje("");
      setError("");

      if (!afpForm.nombre) {
        setError("Debes indicar el nombre de la AFP.");
        return;
      }

      const data = await guardarAFP({
        empresa_id: empresaActiva.id,
        periodo,
        nombre: afpForm.nombre,
        tasa_afp: Number(afpForm.tasa_afp || 0),
        tasa_sis: Number(afpForm.tasa_sis || 0),
        tasa_seguro_social: Number(
          String(afpForm.tasa_seguro_social || "1,00").replace(",", ".")
        ),
      });

      setMensaje(data.mensaje);

      setAfpForm({
        nombre: "",
        tasa_afp: "",
        tasa_sis: "",
        tasa_seguro_social: "1.00",
      });

      await cargarDatos(periodo);
    } catch (err) {
      setError(err.message);
    }
  }

  async function eliminarAfpClick(id) {
    const confirmar = window.confirm("Deseas eliminar esta AFP del periodo?");

    if (!confirmar) return;

    try {
      setMensaje("");
      setError("");

      const data = await eliminarAFP(id, empresaActiva.id);

      setMensaje(data.mensaje);
      await cargarDatos(periodo);
    } catch (err) {
      setError(err.message);
    }
  }

  function opcionesCuentas() {
    const lista = [...cuentas].sort((a, b) =>
      String(a.codigo || "").localeCompare(String(b.codigo || ""), "es-CL")
    );

    return lista.map((cuenta) => (
      <option key={cuenta.id} value={cuenta.id}>
        {cuenta.codigo} - {cuenta.nombre}
      </option>
    ));
  }

  return (
    <div>
      {mensaje && <p style={ok}>{mensaje}</p>}
      {error && <p style={err}>{error}</p>}

      <div style={hero}>
        <div>
          <h1 style={titulo}>Configuracion Remuneraciones</h1>
          <p style={subtitulo}>
            Parametros previsionales, AFP del periodo y cuentas contables.
          </p>
        </div>

        <div style={filtrosHero}>
          <div>
            <label style={labelHero}>Periodo</label>
            <PeriodoMesSelector
              style={inputHero}
              value={periodo}
              onChange={cambiarPeriodo}
              containerStyle={{ width: "100%", minWidth: 220 }}
            />
          </div>

          <button
            type="button"
            style={botonHero}
            onClick={() => cargarDatos(periodo)}
          >
            Buscar
          </button>
        </div>
      </div>

      <div style={card}>
        <TituloIcono icono={<IconoSistema tipo="copiar" />}>
          Copiar configuracion desde otro periodo
        </TituloIcono>

        <div style={alerta}>
          Copia parametros generales, AFP del periodo y cuentas contables desde
          un mes anterior hacia el periodo actual.
        </div>

        <div style={grid}>
          <div>
            <label style={label}>Periodo origen</label>
            <PeriodoMesSelector
              style={input}
              value={periodoOrigen}
              onChange={setPeriodoOrigen}
              containerStyle={{ width: "100%" }}
            />
          </div>

          <div>
            <label style={label}>Periodo destino</label>
            <PeriodoMesSelector
              style={input}
              value={periodoDestino}
              onChange={setPeriodoDestino}
              containerStyle={{ width: "100%" }}
            />
          </div>
        </div>

        <button
          type="button"
          style={botonCopiar}
          onClick={copiarDesdePeriodoAnterior}
        >
          <span style={botonIcono}>
            <IconoSistema tipo="copiar" size={18} />
          </span>
          Copiar configuracion
        </button>
      </div>

      <form style={card} onSubmit={guardarConfig}>
        <TituloIcono icono={<IconoSistema tipo="configuracion" />}>
          Parametros previsionales
        </TituloIcono>

        <div style={grid}>
          <Campo
            label="Salud %"
            name="tasa_salud"
            value={config.tasa_salud}
            onChange={cambiarConfig}
          />

          <Campo
            label="SIS %"
            name="tasa_sis"
            value={config.tasa_sis}
            onChange={cambiarConfig}
          />

          <Campo
            label="AFC trabajador %"
            name="tasa_afc_trabajador"
            value={config.tasa_afc_trabajador}
            onChange={cambiarConfig}
          />

          <Campo
            label="AFC empleador %"
            name="tasa_afc_empleador"
            value={config.tasa_afc_empleador}
            onChange={cambiarConfig}
          />

          <CampoSelect
            label="Mutual"
            name="mutual_codigo_previred"
            value={config.mutual_codigo_previred}
            onChange={cambiarConfig}
            opciones={MUTUALES_PREVIRED.map((item) => (
              <option key={item.codigo} value={item.codigo}>
                {item.nombre}
              </option>
            ))}
          />

          <Campo
            label="Mutual %"
            name="tasa_mutual"
            value={config.tasa_mutual}
            onChange={cambiarConfig}
          />

          <Campo
            label="Sucursal mutual Previred"
            name="mutual_sucursal_previred"
            value={config.mutual_sucursal_previred}
            onChange={cambiarConfig}
          />

          <Campo
            label="Tope imponible UF"
            name="tope_imponible_uf"
            value={config.tope_imponible_uf}
            onChange={cambiarConfig}
          />

          <Campo
            label="Valor UF"
            name="valor_uf"
            value={config.valor_uf}
            onChange={cambiarConfig}
          />

          <Campo
            label="Ingreso minimo"
            name="ingreso_minimo"
            value={config.ingreso_minimo}
            onChange={cambiarConfig}
          />
        </div>

        <TituloIcono icono={<IconoSistema tipo="familia" />} separado>
          Asignacion familiar
        </TituloIcono>

        <div style={grid}>
          <Campo
            label="Tramo A"
            name="tramo_asignacion_a"
            value={config.tramo_asignacion_a}
            onChange={cambiarConfig}
          />

          <Campo
            label="Tramo B"
            name="tramo_asignacion_b"
            value={config.tramo_asignacion_b}
            onChange={cambiarConfig}
          />

          <Campo
            label="Tramo C"
            name="tramo_asignacion_c"
            value={config.tramo_asignacion_c}
            onChange={cambiarConfig}
          />
        </div>

        <TituloIcono icono={<IconoSistema tipo="comprobante" />} separado>
          Cuentas contables remuneraciones
        </TituloIcono>

        <div style={grid}>
          <CampoCuenta
            label="Cuenta gasto sueldos"
            name="cuenta_sueldos_id"
            value={config.cuenta_sueldos_id}
            onChange={cambiarConfig}
            opciones={opcionesCuentas("Gasto")}
          />

          <CampoCuenta
            label="Cuenta AFP por pagar"
            name="cuenta_afp_id"
            value={config.cuenta_afp_id}
            onChange={cambiarConfig}
            opciones={opcionesCuentas("Pasivo")}
          />

          <CampoCuenta
            label="Cuenta salud por pagar"
            name="cuenta_salud_id"
            value={config.cuenta_salud_id}
            onChange={cambiarConfig}
            opciones={opcionesCuentas("Pasivo")}
          />

          <CampoCuenta
            label="Cuenta AFC por pagar"
            name="cuenta_afc_id"
            value={config.cuenta_afc_id}
            onChange={cambiarConfig}
            opciones={opcionesCuentas("Pasivo")}
          />

          <CampoCuenta
            label="Cuenta mutual por pagar"
            name="cuenta_mutual_id"
            value={config.cuenta_mutual_id}
            onChange={cambiarConfig}
            opciones={opcionesCuentas("Pasivo")}
          />

          <CampoCuenta
            label="Cuenta impuesto unico por pagar"
            name="cuenta_impuesto_unico_id"
            value={config.cuenta_impuesto_unico_id}
            onChange={cambiarConfig}
            opciones={opcionesCuentas("Pasivo")}
          />

          <CampoCuenta
            label="Cuenta gasto SIS empleador"
            name="cuenta_sis_empleador_id"
            value={config.cuenta_sis_empleador_id}
            onChange={cambiarConfig}
            opciones={opcionesCuentas("Gasto")}
          />

          <CampoCuenta
            label="Cuenta gasto AFC empleador"
            name="cuenta_afc_empleador_id"
            value={config.cuenta_afc_empleador_id}
            onChange={cambiarConfig}
            opciones={opcionesCuentas("Gasto")}
          />

          <CampoCuenta
            label="Cuenta gasto mutual empleador"
            name="cuenta_mutual_empleador_id"
            value={config.cuenta_mutual_empleador_id}
            onChange={cambiarConfig}
            opciones={opcionesCuentas("Gasto")}
          />

          <CampoCuenta
            label="Cuenta sueldos por pagar"
            name="cuenta_sueldos_por_pagar_id"
            value={config.cuenta_sueldos_por_pagar_id}
            onChange={cambiarConfig}
            opciones={opcionesCuentas("Pasivo")}
          />

          <CampoCuenta
            label="Cuenta otros descuentos por pagar"
            name="cuenta_otros_descuentos_id"
            value={config.cuenta_otros_descuentos_id}
            onChange={cambiarConfig}
            opciones={opcionesCuentas("Pasivo")}
          />

          <CampoCuenta
            label="Cuenta banco pago remuneraciones"
            name="cuenta_banco_pago_id"
            value={config.cuenta_banco_pago_id}
            onChange={cambiarConfig}
            opciones={opcionesCuentas("Activo")}
          />
        </div>

        <button style={botonGuardar} type="submit">
          <span style={botonIcono}>
            <IconoSistema tipo="guardar" size={18} />
          </span>
          Guardar configuracion remuneraciones
        </button>
      </form>

      <form style={card} onSubmit={guardarAfpSubmit}>
        <div style={cardHeader}>
          <div>
            <TituloIcono icono={<IconoSistema tipo="banco" />}>
              AFP del periodo
            </TituloIcono>
            <p style={textoMuted}>
              Registra o actualiza las AFP vigentes para el periodo.
            </p>
          </div>

          <div style={badgeInfo}>{afps.length} AFP</div>
        </div>

        <div style={gridAfp}>
          <Campo
            label="Nombre AFP"
            name="nombre"
            value={afpForm.nombre}
            onChange={cambiarAfp}
            type="text"
          />

          <Campo
            label="Tasa AFP %"
            name="tasa_afp"
            value={afpForm.tasa_afp}
            onChange={cambiarAfp}
          />

          <Campo
            label="Tasa SIS %"
            name="tasa_sis"
            value={afpForm.tasa_sis}
            onChange={cambiarAfp}
          />

          <Campo
            label="Seguro social %"
            name="tasa_seguro_social"
            value={afpForm.tasa_seguro_social}
            onChange={cambiarAfp}
          />
        </div>

        <button style={botonGuardar} type="submit">
          <span style={botonIcono}>
            <IconoSistema tipo="agregar" size={18} />
          </span>
          Agregar / actualizar AFP
        </button>

        <div style={tablaBox}>
          <table style={tabla}>
            <thead>
              <tr>
                <th style={th}>AFP</th>
                <th style={thNumero}>Tasa AFP</th>
                <th style={thNumero}>Tasa SIS</th>
                <th style={thNumero}>Seguro social</th>
                <th style={thAccion}>Accion</th>
              </tr>
            </thead>

            <tbody>
              {afps.map((item) => (
                <tr key={item.id}>
                  <td style={td}>{item.nombre}</td>
                  <td style={tdNumero}>
                    {Number(item.tasa_afp || 0).toLocaleString("es-CL")}%
                  </td>
                  <td style={tdNumero}>
                    {Number(item.tasa_sis || 0).toLocaleString("es-CL")}%
                  </td>
                  <td style={tdNumero}>
                    {Number(item.tasa_seguro_social ?? 1).toLocaleString(
                      "es-CL",
                      {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      }
                    )}
                    %
                  </td>
                  <td style={tdAccion}>
                    <button
                      type="button"
                      style={botonEliminar}
                      onClick={() => eliminarAfpClick(item.id)}
                      title="Eliminar AFP"
                      aria-label="Eliminar AFP"
                    >
                      {"\u2715"}
                    </button>
                  </td>
                </tr>
              ))}

              {afps.length === 0 && (
                <tr>
                  <td style={td} colSpan="5">
                    No hay AFP configuradas para este periodo.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </form>
    </div>
  );
}

function TituloIcono({ icono, children, separado = false }) {
  return (
    <h2 style={separado ? tituloSeccionSeparado : tituloSeccion}>
      <span style={tituloIcono}>{icono}</span>
      {children}
    </h2>
  );
}

function Campo({ etiqueta, label, name, value, onChange, type = "number" }) {
  const textoLabel = etiqueta || label;

  return (
    <div>
      <label style={labelStyle}>{textoLabel}</label>
      <input
        style={inputStyle}
        type={type}
        step={type === "number" ? "0.0001" : undefined}
        name={name}
        value={value}
        onChange={onChange}
      />
    </div>
  );
}

function CampoCuenta({ etiqueta, label, name, value, onChange, opciones }) {
  const textoLabel = etiqueta || label;

  return (
    <div>
      <label style={labelStyle}>{textoLabel}</label>
      <select style={inputStyle} name={name} value={value} onChange={onChange}>
        <option value="">Seleccionar cuenta</option>
        {opciones}
      </select>
    </div>
  );
}

function CampoSelect({ etiqueta, label, name, value, onChange, opciones }) {
  const textoLabel = etiqueta || label;

  return (
    <div>
      <label style={labelStyle}>{textoLabel}</label>
      <select style={inputStyle} name={name} value={value} onChange={onChange}>
        {opciones}
      </select>
    </div>
  );
}

const hero = {
  background: "linear-gradient(135deg, #0f172a, #0369a1, #0ea5e9)",
  borderRadius: "22px",
  padding: "28px",
  color: "white",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "end",
  gap: "20px",
  flexWrap: "wrap",
  marginBottom: "22px",
  boxShadow: "0 12px 30px rgba(15, 23, 42, 0.18)",
};

const titulo = {
  margin: 0,
  fontSize: "32px",
};

const subtitulo = {
  color: "#dff7ff",
  marginBottom: 0,
};

const filtrosHero = {
  display: "flex",
  gap: "12px",
  alignItems: "end",
  flexWrap: "wrap",
};

const labelHero = {
  display: "block",
  fontWeight: "bold",
  color: "#dff7ff",
  marginBottom: "5px",
};

const inputHero = {
  width: "160px",
  padding: "10px",
  border: "1px solid #a9d8ef",
  borderRadius: "10px",
  height: "40px",
  boxSizing: "border-box",
};

const botonHero = {
  background: "white",
  color: "#0369a1",
  border: "none",
  padding: "10px 18px",
  borderRadius: "10px",
  fontWeight: "bold",
  cursor: "pointer",
  height: "40px",
};

const card = {
  background: "white",
  borderRadius: "18px",
  padding: "22px",
  boxShadow: "0 14px 32px rgba(3, 105, 161, 0.12)",
  marginBottom: "20px",
};

const cardHeader = {
  display: "flex",
  justifyContent: "space-between",
  gap: "16px",
  alignItems: "center",
  flexWrap: "wrap",
};

const tituloSeccion = {
  color: "#0369a1",
  marginTop: 0,
  marginBottom: "5px",
  display: "flex",
  alignItems: "center",
  gap: "9px",
};

const tituloSeccionSeparado = {
  color: "#0369a1",
  marginTop: "26px",
  paddingTop: "18px",
  borderTop: "1px solid #e2e8f0",
  display: "flex",
  alignItems: "center",
  gap: "9px",
};

const tituloIcono = {
  width: "36px",
  height: "36px",
  borderRadius: "12px",
  background: "linear-gradient(135deg, #dff7ff, #ecfeff)",
  border: "1px solid #67e8f9",
  color: "#0369a1",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  boxShadow: "0 8px 18px rgba(15, 76, 129, 0.12)",
};

const textoMuted = {
  color: "#475569",
  marginTop: 0,
};

const alerta = {
  background: "#fff7ed",
  border: "1px solid #fed7aa",
  color: "#9a3412",
  padding: "12px",
  borderRadius: "12px",
  marginBottom: "16px",
  fontWeight: "bold",
};

const grid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
  gap: "14px",
};

const gridAfp = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
  gap: "14px",
};

const labelStyle = {
  display: "block",
  fontWeight: "bold",
  color: "#1e293b",
  marginBottom: "5px",
};

const inputStyle = {
  width: "100%",
  padding: "10px",
  border: "1px solid #a9d8ef",
  borderRadius: "10px",
  height: "40px",
  boxSizing: "border-box",
};

const label = labelStyle;
const input = inputStyle;

const botonCopiar = {
  background: "#0369a1",
  color: "white",
  border: "none",
  padding: "12px 16px",
  borderRadius: "10px",
  fontWeight: "bold",
  cursor: "pointer",
  marginTop: "16px",
  display: "inline-flex",
  alignItems: "center",
  gap: "8px",
};

const botonGuardar = {
  marginTop: "18px",
  background: "#10b981",
  color: "white",
  border: "none",
  padding: "12px 18px",
  borderRadius: "10px",
  fontWeight: "bold",
  cursor: "pointer",
  display: "inline-flex",
  alignItems: "center",
  gap: "8px",
};

const botonIcono = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
};

const badgeInfo = {
  background: "linear-gradient(135deg, #dff7ff, #ecfeff)",
  color: "#0369a1",
  padding: "8px 12px",
  borderRadius: "999px",
  fontWeight: "bold",
};

const tablaBox = {
  overflowX: "auto",
  marginTop: "18px",
};

const tabla = {
  width: "100%",
  borderCollapse: "collapse",
};

const th = {
  textAlign: "left",
  padding: "10px",
  background: "linear-gradient(135deg, #dff7ff, #ecfeff)",
  color: "#0369a1",
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

const td = {
  padding: "9px",
  borderBottom: "1px solid #e2e8f0",
  color: "#1e293b",
};

const tdNumero = {
  ...td,
  textAlign: "right",
  whiteSpace: "nowrap",
};

const tdAccion = {
  ...td,
  textAlign: "center",
  whiteSpace: "nowrap",
};

const botonEliminar = {
  background: "linear-gradient(135deg, #ef4444, #f97316)",
  color: "white",
  border: "none",
  width: "32px",
  height: "32px",
  padding: 0,
  borderRadius: "9px",
  fontWeight: "bold",
  cursor: "pointer",
  fontSize: "15px",
  lineHeight: 1,
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
};

const ok = {
  color: "#10b981",
  fontWeight: "bold",
};

const err = {
  color: "#ef4444",
  fontWeight: "bold",
};

