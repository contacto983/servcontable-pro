export default function ModuloHero({ titulo, descripcion, children }) {
  return (
    <div className="serv-modulo-hero">
      <div className="serv-modulo-hero__texto">
        <h1>{titulo}</h1>
        {descripcion && <p>{descripcion}</p>}
      </div>

      {children && <div className="serv-modulo-hero__acciones">{children}</div>}
    </div>
  );
}
