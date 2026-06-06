import { useEffect, useState } from "react";
import { obtenerEmpresaActiva } from "../services/empresaService";
import { listarCuentas } from "../services/cuentaService";
import { obtenerLibroMayor } from "../services/libroMayorService";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { obtenerRangoAnualTrabajo } from "../services/periodoTrabajoService";

export default function LibroMayor() {
  const empresaActiva = obtenerEmpresaActiva();
  const rangoInicial = obtenerRangoAnualTrabajo();

  const [fechaDesde, setFechaDesde] = useState(rangoInicial.fechaDesde);
  const [fechaHasta, setFechaHasta] = useState(rangoInicial.fechaHasta);
  const [cuentaId, setCuentaId] = useState("");

  const [cuentas, setCuentas] = useState([]);
  const [movimientos, setMovimientos] = useState([]);

  const [totales, setTotales] = useState({
    total_debe: 0,
    total_haber: 0,
    saldo: 0,
  });

  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (empresaActiva) {
      cargarCuentas();
    }
  }, []);

  async function cargarCuentas() {
    try {
      setError("");
      const data = await listarCuentas(empresaActiva.id);
      setCuentas(Array.isArray(data.cuentas) ? data.cuentas : []);
    } catch (err) {
      setError(err.message);
    }
  }

  async function buscarLibroMayor() {
    try {
      setMensaje("");
      setError("");

      const data = await obtenerLibroMayor({
        empresa_id: empresaActiva.id,
        fecha_desde: fechaDesde,
        fecha_hasta: fechaHasta,
        cuenta_id: cuentaId,
      });

      const movimientosBackend = Array.isArray(data.movimientos)
        ? data.movimientos
        : [];

      setMovimientos(movimientosBackend);

      setTotales(
        data.totales || {
          total_debe: 0,
          total_haber: 0,
          saldo: 0,
        }
      );

      setMensaje("Libro mayor cargado correctamente.");
    } catch (err) {
      setError(err.message);
    }
  }

  function numero(valor) {
    return Number(valor || 0);
  }

  function formato(valor) {
    return `$${Number(valor || 0).toLocaleString("es-CL")}`;
  }

  function fechaCL(fecha) {
    if (!fecha) return "";
    return String(fecha).substring(0, 10);
  }

  function agruparPorCuenta() {
    const grupos = {};

    movimientos.forEach((mov) => {
      const cuentaKey = String(mov.cuenta_id || "sin-cuenta");

      if (!grupos[cuentaKey]) {
        grupos[cuentaKey] = {
          cuenta_id: mov.cuenta_id,
          cuenta_codigo: mov.cuenta_codigo,
          cuenta_nombre: mov.cuenta_nombre,
          cuenta_naturaleza: mov.cuenta_naturaleza,
          movimientos: [],
          total_debe: 0,
          total_haber: 0,
          saldo: 0,
        };
      }

      grupos[cuentaKey].total_debe += numero(mov.debe);
      grupos[cuentaKey].total_haber += numero(mov.haber);
      grupos[cuentaKey].saldo =
        grupos[cuentaKey].total_debe - grupos[cuentaKey].total_haber;

      grupos[cuentaKey].movimientos.push({
        ...mov,
        saldo_cuenta: grupos[cuentaKey].saldo,
      });
    });

    return Object.values(grupos);
  }

  const gruposCuenta = agruparPorCuenta();
  const cuentasSeguras = Array.isArray(cuentas) ? cuentas : [];

  function exportarExcel() {
    const data = [];

    data.push(["LIBRO MAYOR"]);
    data.push([`Empresa: ${empresaActiva?.razon_social || ""}`]);
    data.push([`RUT: ${empresaActiva?.rut || ""}`]);
    data.push([`Desde: ${fechaDesde}`]);
    data.push([`Hasta: ${fechaHasta}`]);
    data.push([]);

    gruposCuenta.forEach((grupo) => {
      data.push([
        `${grupo.cuenta_codigo || ""} - ${grupo.cuenta_nombre || ""}`,
      ]);
      data.push([`Naturaleza: ${grupo.cuenta_naturaleza || ""}`]);
      data.push([
        "",
        "",
        "",
        "",
        "",
        "Debe",
        numero(grupo.total_debe),
        "Haber",
        numero(grupo.total_haber),
        "Saldo",
        numero(grupo.saldo),
      ]);

      data.push([
        "Fecha",
        "Tipo",
        "N?",
        "Glosa",
        "Debe",
        "Haber",
        "Saldo",
      ]);

      grupo.movimientos.forEach((item) => {
        data.push([
          fechaCL(item.fecha),
          item.tipo,
          item.numero,
          item.glosa_comprobante || item.glosa_detalle || "",
          numero(item.debe),
          numero(item.haber),
          numero(item.saldo_cuenta),
        ]);
      });

      data.push([]);
    });

    data.push(["TOTALES GENERALES"]);
    data.push(["Total debe", numero(totales.total_debe)]);
    data.push(["Total haber", numero(totales.total_haber)]);
    data.push(["Saldo", numero(totales.saldo)]);

    const ws = XLSX.utils.aoa_to_sheet(data);

    ws["!cols"] = [
      { wch: 14 },
      { wch: 16 },
      { wch: 10 },
      { wch: 50 },
      { wch: 16 },
      { wch: 16 },
      { wch: 16 },
      { wch: 16 },
      { wch: 16 },
      { wch: 16 },
      { wch: 16 },
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Libro Mayor");

    XLSX.writeFile(wb, `Libro_Mayor_${fechaDesde}_${fechaHasta}.xlsx`);
  }

  function exportarPDF() {
    const doc = new jsPDF("p", "mm", "letter");

    const margenX = 8;
    const anchoPagina = doc.internal.pageSize.getWidth();
    const altoPagina = doc.internal.pageSize.getHeight();
    const colorPrimario = [15, 76, 129];
    const colorTexto = [30, 41, 59];

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
      doc.text("Libro Mayor", anchoPagina / 2, 19, { align: "center" });

      doc.setDrawColor(...colorPrimario);
      doc.setLineWidth(0.6);
      doc.line(margenX, 27, anchoPagina - margenX, 27);

      return 31;
    }

    let y = dibujarEncabezado();

    gruposCuenta.forEach((grupo, index) => {
      if (index > 0 && y > altoPagina - 65) {
        doc.addPage();
        y = dibujarEncabezado();
      }

      doc.setFillColor(187, 210, 228);
      doc.rect(margenX, y - 2.5, anchoPagina - margenX * 2, 6.5, "F");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9.2);
      doc.setTextColor(...colorPrimario);
      doc.text(
        `${grupo.cuenta_codigo || ""} - ${grupo.cuenta_nombre || ""}`,
        margenX + 2,
        y + 1.5
      );

      y += 8;
      doc.setFontSize(8.3);
      doc.text(`Naturaleza: ${grupo.cuenta_naturaleza || ""}`, margenX + 2, y);

      doc.text(`Debe: ${formato(grupo.total_debe)}`, anchoPagina - margenX, y, {
        align: "right",
      });
      y += 4.5;
      doc.text(`Haber: ${formato(grupo.total_haber)}`, anchoPagina - margenX, y, {
        align: "right",
      });
      y += 4.5;
      doc.text(`Saldo: ${formato(grupo.saldo)}`, anchoPagina - margenX, y, {
        align: "right",
      });

      autoTable(doc, {
        startY: y + 2,
        head: [["Fecha", "Tipo", "N°", "Glosa", "Debe", "Haber", "Saldo"]],
        body: grupo.movimientos.map((item) => [
          fechaCL(item.fecha),
          item.tipo,
          item.numero,
          item.glosa_comprobante || item.glosa_detalle || "",
          numero(item.debe).toLocaleString("es-CL"),
          numero(item.haber).toLocaleString("es-CL"),
          numero(item.saldo_cuenta).toLocaleString("es-CL"),
        ]),
        theme: "grid",
        margin: { left: margenX, right: margenX },
        styles: {
          fontSize: 6.3,
          cellPadding: 1.2,
          textColor: colorTexto,
          lineColor: [190, 204, 219],
          lineWidth: 0.2,
        },
        headStyles: {
          fillColor: colorPrimario,
          textColor: [255, 255, 255],
          fontStyle: "bold",
        },
        alternateRowStyles: {
          fillColor: [249, 252, 255],
        },
        columnStyles: {
          0: { cellWidth: 15 },
          1: { cellWidth: 14 },
          2: { cellWidth: 10, halign: "center" },
          3: { cellWidth: 84 },
          4: { cellWidth: 22, halign: "right" },
          5: { cellWidth: 22, halign: "right" },
          6: { cellWidth: 22, halign: "right" },
        },
      });

      y = doc.lastAutoTable.finalY + 7;
    });

    const totalPaginas = doc.getNumberOfPages();

    for (let i = 1; i <= totalPaginas; i++) {
      doc.setPage(i);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7);
      doc.setTextColor(100, 116, 139);
      doc.text(`Página ${i}/${totalPaginas}`, anchoPagina / 2, altoPagina - 6, {
        align: "center",
      });
    }

    doc.save(`Libro_Mayor_${fechaDesde}_${fechaHasta}.pdf`);
  }

  return (
    <div>
      {mensaje && <p style={ok}>{mensaje}</p>}
      {error && <p style={err}>{error}</p>}

      <h1 style={tituloPrincipal}>Libro mayor</h1>
      <p style={empresaTexto}>
        Empresa activa: <strong>{empresaActiva?.razon_social || ""}</strong>
      </p>

      <div style={cardFiltros}>
        <div>
          <label style={label}>Fecha desde</label>
          <input
            style={input}
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
            style={input}
            type="date"
            min={rangoInicial.fechaDesde}
            max={rangoInicial.fechaHasta}
            value={fechaHasta}
            onChange={(e) => setFechaHasta(e.target.value)}
          />
        </div>

        <div style={{ flex: 1 }}>
          <label style={label}>Cuenta</label>
          <select
            style={inputFull}
            value={cuentaId}
            onChange={(e) => setCuentaId(e.target.value)}
          >
            <option value="">Todas las cuentas</option>
            {cuentasSeguras.map((cuenta) => (
              <option key={cuenta.id} value={cuenta.id}>
                {cuenta.codigo} - {cuenta.nombre}
              </option>
            ))}
          </select>
        </div>

        <button type="button" style={botonExcel} onClick={exportarExcel}>
          Exportar Excel
        </button>

        <button type="button" style={botonPDF} onClick={exportarPDF}>
          Exportar PDF
        </button>

        <button type="button" style={botonBuscar} onClick={buscarLibroMayor}>
          Buscar
        </button>
      </div>

      {gruposCuenta.length === 0 && (
        <div style={cardCuenta}>
          <p style={sinDatos}>No hay movimientos para los filtros seleccionados.</p>
        </div>
      )}

      {gruposCuenta.map((grupo) => (
        <div key={grupo.cuenta_id} style={cardCuenta}>
          <div style={cabeceraCuenta}>
            <div>
              <h2 style={tituloCuenta}>
                {grupo.cuenta_codigo} - {grupo.cuenta_nombre}
              </h2>
              <p style={naturaleza}>
                Naturaleza: {grupo.cuenta_naturaleza || "No indicada"}
              </p>
            </div>

            <div style={resumenCuenta}>
              <p>Debe: {formato(grupo.total_debe)}</p>
              <p>Haber: {formato(grupo.total_haber)}</p>
              <strong>Saldo: {formato(grupo.saldo)}</strong>
            </div>
          </div>

          <div style={tablaBox}>
            <table style={tabla}>
              <thead>
                <tr>
                  <th style={th}>Fecha</th>
                  <th style={th}>Tipo</th>
                  <th style={th}>N?</th>
                  <th style={th}>Glosa</th>
                  <th style={thNumero}>Debe</th>
                  <th style={thNumero}>Haber</th>
                  <th style={thNumero}>Saldo</th>
                </tr>
              </thead>

              <tbody>
                {grupo.movimientos.map((item) => (
                  <tr key={item.detalle_id}>
                    <td style={td}>{fechaCL(item.fecha)}</td>
                    <td style={td}>{item.tipo}</td>
                    <td style={td}>{item.numero}</td>
                    <td style={td}>
                      {item.glosa_comprobante || item.glosa_detalle || ""}
                    </td>
                    <td style={tdNumero}>{formato(item.debe)}</td>
                    <td style={tdNumero}>{formato(item.haber)}</td>
                    <td style={tdNumero}>{formato(item.saldo_cuenta)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </div>
  );
}

const tituloPrincipal = {
  fontSize: "32px",
  color: "#0f172a",
  marginBottom: "10px",
};

const empresaTexto = {
  color: "#475569",
  marginBottom: "18px",
};

const cardFiltros = {
  background: "white",
  borderRadius: "16px",
  padding: "16px",
  boxShadow: "0 14px 32px rgba(3, 105, 161, 0.12)",
  display: "flex",
  alignItems: "end",
  gap: "12px",
  flexWrap: "wrap",
  marginBottom: "18px",
};

const label = {
  display: "block",
  fontWeight: "bold",
  color: "#1e293b",
  marginBottom: "5px",
};

const input = {
  width: "170px",
  padding: "10px",
  border: "1px solid #a9d8ef",
  borderRadius: "9px",
  height: "40px",
  boxSizing: "border-box",
};

const inputFull = {
  width: "100%",
  minWidth: "250px",
  padding: "10px",
  border: "1px solid #a9d8ef",
  borderRadius: "9px",
  height: "40px",
  boxSizing: "border-box",
};

const botonBase = {
  color: "white",
  border: "none",
  padding: "11px 18px",
  borderRadius: "9px",
  fontWeight: "bold",
  cursor: "pointer",
  height: "40px",
};

const botonExcel = {
  ...botonBase,
  background: "#10b981",
};

const botonPDF = {
  ...botonBase,
  background: "#ef4444",
};

const botonBuscar = {
  ...botonBase,
  background: "#0369a1",
};

const cardCuenta = {
  background: "white",
  borderRadius: "16px",
  padding: "22px",
  boxShadow: "0 14px 32px rgba(3, 105, 161, 0.12)",
  marginBottom: "20px",
};

const cabeceraCuenta = {
  display: "flex",
  justifyContent: "space-between",
  gap: "18px",
  flexWrap: "wrap",
  marginBottom: "16px",
};

const tituloCuenta = {
  color: "#0369a1",
  margin: 0,
  fontSize: "23px",
};

const naturaleza = {
  color: "#475569",
  marginTop: "6px",
};

const resumenCuenta = {
  textAlign: "right",
  color: "#1e293b",
  minWidth: "180px",
};

const tablaBox = {
  overflowX: "auto",
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

const sinDatos = {
  color: "#475569",
  fontWeight: "bold",
};

const ok = {
  color: "#10b981",
  fontWeight: "bold",
};

const err = {
  color: "#ef4444",
  fontWeight: "bold",
};
