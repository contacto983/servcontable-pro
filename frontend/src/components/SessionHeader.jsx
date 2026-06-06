const LOGO_SRC = "/servcontable-logo.png";

const buttonVariants = {
  primary: "sc-btn--primary",
  danger: "sc-btn--danger",
  ghost: "sc-btn--ghost",
  outline: "sc-btn--outline",
};

export default function SessionHeader({ usuario, actions = [] }) {
  const usuarioVisible = usuario?.nombre || usuario?.email || "Usuario";

  return (
    <header className="sc-session-bar">
      <div className="sc-session-brand">
        <img className="sc-logo-mark sc-logo-mark--small" src={LOGO_SRC} alt="ServContable" />
        <div className="sc-session-user">
          <strong>ServContable PRO</strong>
          <span>{usuarioVisible}</span>
        </div>
      </div>

      {actions.length > 0 && (
        <div className="sc-session-actions">
          {actions.map((action) => (
            <button
              key={action.label}
              type="button"
              className={`sc-btn ${buttonVariants[action.variant] || buttonVariants.primary}`}
              onClick={action.onClick}
            >
              {action.label}
            </button>
          ))}
        </div>
      )}
    </header>
  );
}
