import SessionHeader from "../components/SessionHeader";

export default function SelectorModulo({ usuario, seleccionarModulo, alCerrarSesion }) {
  return (
    <div className="sc-page-shell">
      <SessionHeader
        usuario={usuario}
        actions={[
          {
            label: "Cerrar sesión",
            onClick: alCerrarSesion,
            variant: "danger",
          },
        ]}
      />

      <main className="sc-selector-content">
        <section className="sc-selector-intro">
          <h1 className="sc-page-title">Seleccionar módulo</h1>
          <p className="sc-page-subtitle">
            Elige el área de trabajo y continúa con una experiencia más limpia,
            rápida y enfocada.
          </p>
        </section>

        <div className="sc-module-grid">
          <button
            type="button"
            className="sc-module-card"
            onClick={() => seleccionarModulo("contable")}
          >
            <span className="sc-module-icon">📊</span>
            <h2>Módulo Contable</h2>
            <p>
              Empresas, plan de cuentas, comprobantes, compras, ventas,
              libros, balances, IVA y F29.
            </p>
            <span className="sc-card-cta">Entrar a Contabilidad</span>
          </button>

          <button
            type="button"
            className="sc-module-card"
            onClick={() => seleccionarModulo("remuneraciones")}
          >
            <span className="sc-module-icon">👥</span>
            <h2>Módulo Remuneraciones</h2>
            <p>
              Trabajadores, liquidaciones, haberes, descuentos, Previred,
              libro de remuneraciones y pagos.
            </p>
            <span className="sc-card-cta">Entrar a Remuneraciones</span>
          </button>
        </div>
      </main>
    </div>
  );
}
