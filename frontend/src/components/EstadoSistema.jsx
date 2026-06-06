import { useEffect, useState } from "react";
import { obtenerEstadoSistema } from "../services/api";
import { API_BASE_URL } from "../services/apiConfig";

export default function EstadoSistema() {
  const [estadoBackend, setEstadoBackend] = useState("Verificando conexion...");
  const [detalleBackend, setDetalleBackend] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    async function verificarBackend() {
      try {
        const data = await obtenerEstadoSistema();

        setDetalleBackend(data);
        setEstadoBackend("Backend conectado correctamente");
        setError("");
      } catch (err) {
        setEstadoBackend("No se pudo conectar con el backend");
        setError(`Revisa que el backend este disponible en ${API_BASE_URL}`);
      }
    }

    verificarBackend();
  }, []);

  return (
    <div style={{
      background: "#eef8ff",
      border: "1px solid #67e8f9",
      borderRadius: "14px",
      padding: "18px",
      marginTop: "20px"
    }}>
      <h2 style={{
        color: "#0369a1",
        fontSize: "20px",
        margin: "0 0 10px"
      }}>
        Estado del sistema
      </h2>

      <p style={{
        color: estadoBackend.includes("correctamente") ? "#10b981" : "#ef4444",
        fontWeight: "bold",
        fontSize: "17px"
      }}>
        {estadoBackend}
      </p>

      {detalleBackend && (
        <div style={{
          marginTop: "15px",
          textAlign: "left",
          background: "#ffffff",
          borderRadius: "12px",
          padding: "15px",
          color: "#1e293b",
          fontSize: "15px"
        }}>
          <p><strong>Sistema:</strong> {detalleBackend.sistema}</p>
          <p><strong>Backend:</strong> {detalleBackend.backend}</p>
          <p><strong>Version:</strong> {detalleBackend.version}</p>
        </div>
      )}

      {error && (
        <p style={{
          marginTop: "15px",
          color: "#ef4444",
          fontSize: "14px"
        }}>
          {error}
        </p>
      )}
    </div>
  );
}