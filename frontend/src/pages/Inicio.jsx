import EstadoSistema from "../components/EstadoSistema";

export default function Inicio() {
  return (
    <div style={{
      minHeight: "100vh",
      background: "#eef7ff",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontFamily: "Arial, sans-serif",
      padding: "20px"
    }}>
      <div style={{
        background: "white",
        padding: "40px",
        borderRadius: "18px",
        boxShadow: "0 10px 30px rgba(0,0,0,0.12)",
        textAlign: "center",
        width: "100%",
        maxWidth: "520px"
      }}>
        <h1 style={{
          color: "#0369a1",
          fontSize: "36px",
          marginBottom: "10px"
        }}>
          ServContable PRO Web
        </h1>

        <p style={{
          color: "#555",
          fontSize: "18px",
          marginBottom: "25px"
        }}>
          Sistema contable profesional en construcción
        </p>

        <EstadoSistema />
      </div>
    </div>
  );
}