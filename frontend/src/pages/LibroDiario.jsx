import { useEffect, useState } from "react";
import { obtenerEmpresaActiva } from "../services/empresaService";
import { obtenerLibroDiario } from "../services/libroDiarioService";
import { exportarExcel } from "../utils/exportUtils";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { obtenerRangoAnualTrabajo } from "../services/periodoTrabajoService";

export default function LibroDiario() {
  const empresaActiva = obtenerEmpresaActiva();
  const rangoInicial = obtenerRangoAnualTrabajo();

  const [fechaDesde, setFechaDesde] = useState(rangoInicial.fechaDesde);
  const [fechaHasta, setFechaHasta] = useState(rangoInicial.fechaHasta);
  const [movimientos, setMovimientos] = useState([]);
  const [resumen, setResumen] = useState({
    total_debe: 0,
    total_haber: 0,
    diferencia: 0,
  });
  const [error, setError] = useState("");

  useEffect(() => {
    if (empresaActiva) {
      cargarDatos();
    }
  }, []);

  async function cargarDatos() {
    try {
      setError("");

      const data = await obtenerLibroDiario(
        empresaActiva.id,
        fechaDesde,
        fechaHasta
      );

      setMovimientos(data.movimientos || []);

      const totalDebe = Number(data.totales?.debe || 0);
      const totalHaber = Number(data.totales?.haber || 0);

      setResumen({
        total_debe: totalDebe,
        total_haber: totalHaber,
        diferencia: totalDebe - totalHaber,
      });
    } catch (err) {
      setError(err.message);
    }
  }

  function exportarLibroDiarioExcel() {
    const filas = movimientos.map((mov) => ({
      Fecha: mov.fecha?.substring(0, 10),
      Tipo: mov.tipo,
      Numero: mov.numero,
      Codigo: mov.codigo_cuenta,
      Cuenta: mov.nombre_cuenta,
      Glosa: mov.glosa_detalle || mov.glosa_comprobante,
      Debe: Number(mov.debe || 0),
      Haber: Number(mov.haber || 0),
    }));

    exportarExcel(`Libro_Diario_${fechaDesde}_${fechaHasta}`, filas);
  }

  function formato(valor) {
    return Number(valor || 0).toLocaleString("es-CL");
  }

  function fechaCL(fecha) {
    if (!fecha) return "";
    const texto = String(fecha).substring(0, 10);
    const partes = texto.split("-");
    if (partes.length !== 3) return texto;
    return `${partes[2]}-${partes[1]}-${partes[0]}`;
  }

  function exportarLibroDiarioPDF() {
    const doc = new jsPDF("p", "mm", "letter");

    const colorPrimario = [15, 76, 129];
    const colorBanda = [187, 210, 228];
    const colorTexto = [30, 41, 59];

    const margenX = 8;
    const anchoPagina = doc.internal.pageSize.getWidth();
    const altoPagina = doc.internal.pageSize.getHeight();

    function dibujarEncabezado() {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(...colorTexto);
      doc.text(`Razón Social: ${empresaActiva?.razon_social || ""}`, margenX, 10);
      doc.text(`RUT: ${empresaActiva?.rut || ""}`, margenX, 16);

      doc.text(`Desde: ${fechaDesde}`, anchoPagina - margenX, 10, { align: "right" });
      doc.text(`Hasta: ${fechaHasta}`, anchoPagina - margenX, 16, { align: "right" });
      doc.text(
        `Fecha emisión: ${new Date().toLocaleDateString("es-CL")}`,
        anchoPagina - margenX,
        22,
        { align: "right" }
      );

      doc.setTextColor(...colorPrimario);
      doc.setFontSize(15);
      doc.text("Libro Diario", anchoPagina / 2, 19, { align: "center" });

      doc.setDrawColor(...colorPrimario);
      doc.setLineWidth(0.6);
      doc.line(margenX, 27, anchoPagina - margenX, 27);

      return 31;
    }

    const grupos = {};

    movimientos.forEach((mov) => {
      const clave = `${mov.tipo}-${mov.numero}-${mov.fecha}`;

      if (!grupos[clave]) {
        grupos[clave] = {
          tipo: mov.tipo,
          numero: mov.numero,
          fecha: mov.fecha,
          glosa: mov.glosa_comprobante || mov.glosa_general || "",
          detalles: [],
          totalDebe: 0,
          totalHaber: 0,
        };
      }

      grupos[clave].detalles.push(mov);
      grupos[clave].totalDebe += Number(mov.debe || 0);
      grupos[clave].totalHaber += Number(mov.haber || 0);
    });

    const comprobantes = Object.values(grupos);
    let y = dibujarEncabezado();

    comprobantes.forEach((comp, index) => {
      if (index > 0 && y > altoPagina - 62) {
        doc.addPage();
        y = dibujarEncabezado();
      }

      doc.setFillColor(...colorBanda);
      doc.rect(margenX, y - 2.5, anchoPagina - margenX * 2, 6.5, "F");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9.2);
      doc.setTextColor(...colorPrimario);
      doc.text(
        `Comprobante de ${comp.tipo} N° ${comp.numero} - Fecha: ${fechaCL(comp.fecha)}`,
        margenX + 2,
        y + 1.5
      );

      y += 8;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8.4);
      doc.text("Glosa General:", margenX + 2, y);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(...colorTexto);
      doc.text(String(comp.glosa || ""), margenX + 25, y, {
        maxWidth: anchoPagina - margenX * 2 - 27,
      });

      const filas = comp.detalles.map((mov) => [
        mov.codigo_cuenta || mov.codigo || "",
        mov.nombre_cuenta || mov.cuenta || "",
        mov.auxiliar || mov.rut_auxiliar || "",
        mov.documento || mov.folio || "",
        formato(mov.debe),
        formato(mov.haber),
        mov.glosa_detalle || mov.descripcion || comp.glosa || "",
      ]);

      filas.push([
        "",
        "Totales",
        "",
        "",
        formato(comp.totalDebe),
        formato(comp.totalHaber),
        "",
      ]);

      autoTable(doc, {
        startY: y + 2,
        head: [["Cuenta", "Nombre de la Cuenta", "Auxiliar", "Documento", "Debe", "Haber", "Descripción"]],
        body: filas,
        theme: "grid",
        margin: {
          left: margenX,
          right: margenX,
        },
        styles: {
          fontSize: 6.2,
          cellPadding: 1.2,
          textColor: colorTexto,
          lineColor: [190, 204, 219],
          lineWidth: 0.2,
          valign: "middle",
        },
        headStyles: {
          fillColor: colorPrimario,
          textColor: [255, 255, 255],
          fontStyle: "bold",
          halign: "center",
        },
        alternateRowStyles: {
          fillColor: [249, 252, 255],
        },
        columnStyles: {
          0: { cellWidth: 16 },
          1: { cellWidth: 44 },
          2: { cellWidth: 19 },
          3: { cellWidth: 19 },
          4: { cellWidth: 20, halign: "right" },
          5: { cellWidth: 20, halign: "right" },
          6: { cellWidth: 58 },
        },
        didParseCell(data) {
          const esFilaTotal = data.row.index === filas.length - 1;
          if (esFilaTotal) {
            data.cell.styles.fillColor = [235, 242, 248];
            data.cell.styles.fontStyle = "bold";
            data.cell.styles.textColor = colorPrimario;
          }
        },
      });

      y = doc.lastAutoTable.finalY + 7;
    });

    const totalPaginas = doc.internal.getNumberOfPages();

    for (let i = 1; i <= totalPaginas; i++) {
      doc.setPage(i);
      doc.setFontSize(7);
      doc.setTextColor(100, 116, 139);
      doc.text(`Página ${i}/${totalPaginas}`, anchoPagina / 2, altoPagina - 6, {
        align: "center",
      });
    }

    doc.save(`Libro_Diario_${fechaDesde}_${fechaHasta}.pdf`);
  }

  if (!empresaActiva) {
    return (
      <div>
        <h1 style={titulo}>Libro diario</h1>
        <div style={alerta}>
          Debes seleccionar una empresa activa antes de ver el libro diario.
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1 style={titulo}>Libro diario</h1>
      <p style={subtitulo}>
        Empresa activa: <strong>{empresaActiva.razon_social}</strong>
      </p>

      <div style={filtrosAcciones}>
        <div>
          <label style={label}>Fecha desde</label>
          <input
            style={inputPeriodo}
            type="date"
            min={rangoInicial.fechaDesde}
            max={rangoInicial.fechaHasta}
            value={fechaDesde}
            onChange={(e) => setFechaDesde(e.target.value)}
          />
        </div>

        <div>
          <label style={label}>Fecha hasta</label>
          <input
            style={inputPeriodo}
            type="date"
            min={rangoInicial.fechaDesde}
            max={rangoInicial.fechaHasta}
            value={fechaHasta}
            onChange={(e) => setFechaHasta(e.target.value)}
          />
        </div>

        <button style={botonExcel} onClick={exportarLibroDiarioExcel}>
          Exportar Excel
        </button>

        <button style={botonPDF} onClick={exportarLibroDiarioPDF}>
          Exportar PDF
        </button>

        <button style={botonBuscar} onClick={cargarDatos}>
          Buscar
        </button>
      </div>


      {error && <p style={err}>{error}</p>}

      <div style={resumenBox}>
        <div style={cardResumen}>
          <strong>Total Debe</strong>
          <span>${resumen.total_debe.toLocaleString("es-CL")}</span>
        </div>

        <div style={cardResumen}>
          <strong>Total Haber</strong>
          <span>${resumen.total_haber.toLocaleString("es-CL")}</span>
        </div>

        <div style={resumen.diferencia === 0 ? cardResumenOk : cardResumenError}>
          <strong>Diferencia</strong>
          <span>${resumen.diferencia.toLocaleString("es-CL")}</span>
        </div>
      </div>

      <div style={tablaBox}>
        <h2 style={tituloSeccion}>Movimientos contables</h2>

        <table style={tabla}>
          <thead>
            <tr>
              <th style={th}>Fecha</th>
              <th style={th}>Tipo</th>
              <th style={th}>N?</th>
              <th style={th}>Codigo</th>
              <th style={th}>Cuenta</th>
              <th style={th}>Glosa</th>
              <th style={th}>Debe</th>
              <th style={th}>Haber</th>
            </tr>
          </thead>

          <tbody>
            {movimientos.map((mov, index) => (
              <tr key={index}>
                <td style={td}>{mov.fecha?.substring(0, 10)}</td>
                <td style={td}>{mov.tipo}</td>
                <td style={td}>{mov.numero}</td>
                <td style={td}>{mov.codigo_cuenta}</td>
                <td style={td}>{mov.nombre_cuenta}</td>
                <td style={td}>
                  {mov.glosa_detalle || mov.glosa_comprobante}
                </td>
                <td style={tdNumero}>
                  ${Number(mov.debe).toLocaleString("es-CL")}
                </td>
                <td style={tdNumero}>
                  ${Number(mov.haber).toLocaleString("es-CL")}
                </td>
              </tr>
            ))}

            {movimientos.length === 0 && (
              <tr>
                <td style={td} colSpan="8">
                  No hay movimientos para el rango de fechas seleccionado.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const titulo = {
  fontSize: "34px",
  color: "#0f172a",
  marginBottom: "5px",
};

const subtitulo = {
  color: "#475569",
  marginBottom: "18px",
};

const filtrosBox = {
  display: "flex",
  alignItems: "end",
  gap: "15px",
  background: "white",
  padding: "18px",
  borderRadius: "16px",
  boxShadow: "0 14px 32px rgba(3, 105, 161, 0.12)",
  marginBottom: "20px",
};

const label = {
  display: "block",
  fontWeight: "bold",
  color: "#1e293b",
  marginBottom: "5px",
};

const input = {
  padding: "11px",
  border: "1px solid #a9d8ef",
  borderRadius: "10px",
  minWidth: "160px",
};

const resumenBox = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
  gap: "15px",
  marginBottom: "18px",
};

const cardResumen = {
  background: "white",
  borderRadius: "16px",
  padding: "18px",
  boxShadow: "0 14px 32px rgba(3, 105, 161, 0.12)",
  display: "flex",
  flexDirection: "column",
  gap: "8px",
  color: "#1e293b",
};

const cardResumenOk = {
  ...cardResumen,
  border: "2px solid #22c55e",
};

const cardResumenError = {
  ...cardResumen,
  border: "2px solid #ef4444",
};

const tablaBox = {
  background: "white",
  borderRadius: "18px",
  padding: "25px",
  boxShadow: "0 14px 32px rgba(3, 105, 161, 0.12)",
  overflowX: "auto",
};

const tituloSeccion = {
  color: "#0369a1",
  marginTop: 0,
};

const tabla = {
  width: "100%",
  borderCollapse: "collapse",
};

const th = {
  textAlign: "left",
  padding: "12px",
  background: "linear-gradient(135deg, #dff7ff, #ecfeff)",
  color: "#0369a1",
};

const td = {
  padding: "10px",
  borderBottom: "1px solid #e2e8f0",
  color: "#1e293b",
};

const tdNumero = {
  ...td,
  textAlign: "right",
};

const err = {
  color: "#ef4444",
  fontWeight: "bold",
};

const alerta = {
  marginTop: "25px",
  background: "#fff7ed",
  border: "1px solid #fed7aa",
  color: "#9a3412",
  padding: "16px",
  borderRadius: "14px",
  fontWeight: "bold",
};

const filtrosAcciones = {
  display: "flex",
  alignItems: "end",
  gap: "10px",
  flexWrap: "wrap",
  marginBottom: "18px",
};

const inputPeriodo = {
  padding: "10px",
  border: "1px solid #a9d8ef",
  borderRadius: "9px",
  minWidth: "180px",
  height: "40px",
  boxSizing: "border-box",
};

const botonExcel = {
  background: "#10b981",
  color: "white",
  border: "none",
  padding: "10px 16px",
  borderRadius: "9px",
  fontWeight: "bold",
  cursor: "pointer",
  height: "40px",
};

const botonPDF = {
  background: "#ef4444",
  color: "white",
  border: "none",
  padding: "10px 16px",
  borderRadius: "9px",
  fontWeight: "bold",
  cursor: "pointer",
  height: "40px",
};

const botonBuscar = {
  background: "#0369a1",
  color: "white",
  border: "none",
  padding: "10px 20px",
  borderRadius: "9px",
  fontWeight: "bold",
  cursor: "pointer",
  height: "40px",
};
