import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export function exportarExcel(nombreArchivo, filas) {
  const hoja = XLSX.utils.json_to_sheet(filas);
  const libro = XLSX.utils.book_new();

  XLSX.utils.book_append_sheet(libro, hoja, "Reporte");

  XLSX.writeFile(libro, `${nombreArchivo}.xlsx`);
}

export function exportarPDF(nombreArchivo, titulo, columnas, filas) {
  const doc = new jsPDF({
    orientation: "landscape",
    unit: "pt",
    format: "a4",
  });

  doc.setFontSize(14);
  doc.text(titulo, 40, 35);

  autoTable(doc, {
    startY: 55,
    head: [columnas],
    body: filas,
    styles: {
      fontSize: 8,
      cellPadding: 4,
    },
    headStyles: {
      fillColor: [15, 76, 129],
    },
  });

  doc.save(`${nombreArchivo}.pdf`);
}