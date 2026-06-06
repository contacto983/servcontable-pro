import jsPDF from "jspdf";

function numero(valor) {
  return Number(valor || 0);
}

function formato(valor) {
  return `$ ${Math.round(Number(valor || 0)).toLocaleString("es-CL")}`;
}

function fechaISO(fecha) {
  if (!fecha) return "";
  return String(fecha).substring(0, 10);
}

function texto(valor, respaldo = "") {
  return String(valor || respaldo || "").trim();
}

function nombreTrabajador(finiquito) {
  return texto(
    `${finiquito.trabajador_nombres || ""} ${
      finiquito.trabajador_apellidos || ""
    }`
  );
}

function limpiarNombreArchivo(valor) {
  return String(valor || "")
    .replace(/[^\w-]+/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_|_$/g, "");
}

function limpiarParrafo(valor) {
  return String(valor || "")
    .replace(/\s+/g, " ")
    .replace(/\s+([,.;:])/g, "$1")
    .trim();
}

function totalDescuentos(finiquito) {
  return (
    numero(finiquito.descuentos) +
    numero(finiquito.seguro_cesantia_descuento) +
    numero(finiquito.otros_descuentos)
  );
}

function totalHaberesCalculado(finiquito) {
  return (
    numero(finiquito.sueldo_pendiente) +
    numero(finiquito.vacaciones_proporcionales || finiquito.monto_vacaciones_pendientes) +
    numero(finiquito.indemnizacion_aviso_previo) +
    numero(finiquito.indemnizacion_anios_servicio) +
    numero(finiquito.indemnizacion_voluntaria) +
    numero(finiquito.otros_haberes)
  );
}

function conceptosLiquidacion(finiquito) {
  const haberes = [];
  const descuentos = [];

  function agregar(lista, concepto, monto, detalle = "") {
    if (numero(monto) <= 0) return;
    lista.push({
      concepto,
      monto: numero(monto),
      detalle: limpiarParrafo(detalle),
    });
  }

  agregar(
    haberes,
    "Remuneraciones pendientes",
    finiquito.sueldo_pendiente,
    finiquito.observacion_sueldo_pendiente
  );
  agregar(
    haberes,
    "Vacaciones pendientes",
    finiquito.monto_vacaciones_pendientes || finiquito.vacaciones_proporcionales,
    finiquito.observacion_vacaciones
  );
  agregar(
    haberes,
    "Indemnización sustitutiva aviso previo",
    finiquito.indemnizacion_aviso_previo,
    finiquito.observacion_aviso_previo
  );
  agregar(
    haberes,
    "Indemnización años de servicio",
    finiquito.indemnizacion_anios_servicio,
    finiquito.observacion_anios_servicio
  );
  agregar(
    haberes,
    "Indemnización voluntaria",
    finiquito.indemnizacion_voluntaria,
    finiquito.observacion_indemnizacion_voluntaria
  );
  agregar(haberes, "Otros haberes", finiquito.otros_haberes, finiquito.observacion_otros_haberes);

  agregar(descuentos, "Seguro cesantía / descuento AFC", finiquito.seguro_cesantia_descuento);
  agregar(descuentos, "Otros descuentos", finiquito.otros_descuentos, finiquito.observacion_descuentos);
  agregar(descuentos, "Descuentos", finiquito.descuentos);

  return { haberes, descuentos };
}

function agregarPagina(doc, colorTexto) {
  doc.addPage();
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(...colorTexto);
  return 22;
}

function asegurarEspacio(doc, y, requerido, colorTexto) {
  const altoPagina = doc.internal.pageSize.getHeight();
  if (y + requerido <= altoPagina - 22) return y;
  return agregarPagina(doc, colorTexto);
}

function escribirParrafo(doc, textoParrafo, y, opciones) {
  const {
    x,
    ancho,
    lineHeight,
    colorTexto,
    colorPrimario,
    titulo,
  } = opciones;

  y = asegurarEspacio(doc, y, titulo ? 16 : 10, colorTexto);

  if (titulo) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(...colorPrimario);
    doc.text(titulo, x, y);
    y += 5;
  }

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(...colorTexto);

  const lineas = doc.splitTextToSize(limpiarParrafo(textoParrafo), ancho);

  for (const linea of lineas) {
    y = asegurarEspacio(doc, y, lineHeight, colorTexto);
    doc.text(linea, x, y);
    y += lineHeight;
  }

  return y + 3;
}

function escribirLineaMonto(doc, y, concepto, monto, opciones) {
  const { x, ancho, lineHeight, colorTexto, colorPrimario, destacado = false } = opciones;
  y = asegurarEspacio(doc, y, lineHeight + 2, colorTexto);

  if (destacado) {
    doc.setFillColor(224, 242, 254);
    doc.roundedRect(x - 2, y - 4.5, ancho + 4, 7.5, 1.5, 1.5, "F");
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...colorPrimario);
  } else {
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...colorTexto);
  }

  doc.setFontSize(10);
  doc.text(concepto, x, y);
  doc.text(formato(monto), x + ancho, y, { align: "right" });

  return y + lineHeight;
}

function agregarDetalleConcepto(doc, y, concepto, opciones) {
  y = escribirLineaMonto(doc, y, concepto.concepto, concepto.monto, opciones);
  return y;
}

function agregarFirmas(doc, y, datos, colores) {
  const { colorTexto, colorPrimario } = colores;
  const altoPagina = doc.internal.pageSize.getHeight();

  if (y > altoPagina - 65) {
    y = agregarPagina(doc, colorTexto);
  }

  y = Math.max(y + 14, altoPagina - 58);

  doc.setDrawColor(...colorTexto);
  doc.setLineWidth(0.3);
  doc.line(24, y, 84, y);
  doc.line(126, y, 186, y);

  y += 6;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(...colorPrimario);
  doc.text("FIRMA EMPLEADOR", 54, y, { align: "center" });
  doc.text("FIRMA TRABAJADOR", 156, y, { align: "center" });

  y += 8;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(...colorTexto);

  if (datos.representanteNombre) {
    doc.text(datos.representanteNombre.toUpperCase(), 54, y, { align: "center" });
    y += 5;
    if (datos.representanteRut) {
      doc.text(datos.representanteRut, 54, y, { align: "center" });
      y += 5;
    }
    doc.text(`pp. ${datos.empresaNombre}`, 54, y, { align: "center" });
  } else {
    doc.text(datos.empresaNombre, 54, y, { align: "center" });
    y += 5;
    doc.text(datos.empresaRut, 54, y, { align: "center" });
  }

  y -= datos.representanteNombre ? 10 : 5;

  doc.text(datos.trabajadorNombre.toUpperCase(), 156, y, { align: "center" });
  y += 5;
  doc.text(datos.trabajadorRut, 156, y, { align: "center" });
}

function agregarPiePaginas(doc) {
  const paginas = doc.internal.getNumberOfPages();
  const anchoPagina = doc.internal.pageSize.getWidth();

  for (let i = 1; i <= paginas; i += 1) {
    doc.setPage(i);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text(`Página ${i} de ${paginas}`, anchoPagina / 2, 287, {
      align: "center",
    });
  }
}

export function exportarFiniquitoPDF(finiquito, empresaActiva) {
  const doc = new jsPDF("p", "mm", "a4");

  const colorPrimario = [15, 76, 129];
  const colorTexto = [15, 23, 42];
  const colorLinea = [203, 213, 225];

  const x = 17;
  const ancho = 176;
  const lineHeight = 5;
  const anchoPagina = doc.internal.pageSize.getWidth();

  const trabajadorNombre = nombreTrabajador(finiquito);
  const trabajadorRut = texto(finiquito.trabajador_rut);
  const trabajadorCargo = texto(finiquito.trabajador_cargo, "cargo registrado");
  const trabajadorNacionalidad = texto(finiquito.trabajador_nacionalidad, "Chile");
  const trabajadorDomicilio = texto(
    finiquito.trabajador_direccion || finiquito.domicilio_trabajador,
    "domicilio registrado en antecedentes de la empresa"
  );

  const empresaNombre = texto(
    empresaActiva?.razon_social || finiquito.razon_social,
    "Empresa"
  );
  const empresaRut = texto(empresaActiva?.rut || finiquito.empresa_rut);
  const empresaCiudad = texto(
    empresaActiva?.ciudad || finiquito.empresa_ciudad || empresaActiva?.comuna || finiquito.empresa_comuna,
    "Chile"
  );
  const representanteNombre = texto(
    empresaActiva?.representante_legal || finiquito.representante_legal
  );
  const representanteRut = texto(
    empresaActiva?.rut_representante || finiquito.rut_representante
  );

  const fechaEmision = fechaISO(new Date().toISOString());
  const fechaIngreso = fechaISO(finiquito.trabajador_fecha_ingreso);
  const fechaTermino = fechaISO(finiquito.fecha_termino);
  const causal = texto(finiquito.causal, "causal registrada en el sistema");
  const totalHaberes =
    numero(finiquito.total_haberes) > 0
      ? numero(finiquito.total_haberes)
      : totalHaberesCalculado(finiquito);
  const descuentos = totalDescuentos(finiquito);
  const totalPagar =
    numero(finiquito.total_finiquito) > 0
      ? numero(finiquito.total_finiquito)
      : totalHaberes - descuentos;
  const { haberes, descuentos: conceptosDescuento } = conceptosLiquidacion(finiquito);

  let y = 18;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(15);
  doc.setTextColor(...colorPrimario);
  doc.text("FINIQUITO DE TRABAJO", anchoPagina / 2, y, { align: "center" });

  y += 6;
  doc.setDrawColor(...colorPrimario);
  doc.setLineWidth(0.6);
  doc.line(x, y, anchoPagina - x, y);

  y += 10;

  const representacion = representanteNombre
    ? `representada por Don(a) ${representanteNombre}, R.U.T ${representanteRut || "sin RUT registrado"}`
    : "representada por quien suscribe";

  y = escribirParrafo(
    doc,
    `En ${empresaCiudad}, ${fechaEmision}, entre ${empresaNombre}, R.U.T ${empresaRut}, en adelante también "el empleador", ${representacion}, por una parte; y por la otra, Don(a) ${trabajadorNombre}, R.U.T ${trabajadorRut}, nacionalidad ${trabajadorNacionalidad}, domiciliado(a) en ${trabajadorDomicilio}, en adelante también "el trabajador(a)", se deja testimonio y se ha acordado el finiquito que consta de las siguientes cláusulas:`,
    y,
    { x, ancho, lineHeight, colorTexto, colorPrimario }
  );

  y = escribirParrafo(
    doc,
    `El trabajador prestó servicios al empleador desde el ${fechaIngreso} hasta el ${fechaTermino}, fecha esta última en que su contrato de trabajo ha terminado por ${causal}.`,
    y,
    { x, ancho, lineHeight, colorTexto, colorPrimario, titulo: "PRIMERO:" }
  );

  y = escribirParrafo(
    doc,
    `Don(a) ${trabajadorNombre} declara recibir en este acto, a su entera satisfacción, de parte de ${empresaNombre} la suma de ${formato(totalPagar)}, según la liquidación que se señala a continuación:`,
    y,
    { x, ancho, lineHeight, colorTexto, colorPrimario, titulo: "SEGUNDO:" }
  );

  y = asegurarEspacio(doc, y, 30, colorTexto);
  doc.setDrawColor(...colorLinea);
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(x, y - 3, ancho, 10, 2, 2, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(...colorPrimario);
  doc.text("Liquidación del finiquito", x + 4, y + 3);
  y += 12;

  if (haberes.length === 0) {
    y = escribirLineaMonto(doc, y, "Total haberes", totalHaberes, {
      x: x + 4,
      ancho: ancho - 8,
      lineHeight,
      colorTexto,
      colorPrimario,
    });
  } else {
    for (const concepto of haberes) {
      y = agregarDetalleConcepto(doc, y, concepto, {
        x: x + 4,
        ancho: ancho - 8,
        lineHeight,
        colorTexto,
        colorPrimario,
      });
    }
  }

  if (descuentos > 0) {
    y += 2;
    for (const concepto of conceptosDescuento) {
      y = agregarDetalleConcepto(doc, y, concepto, {
        x: x + 4,
        ancho: ancho - 8,
        lineHeight,
        colorTexto,
        colorPrimario,
      });
    }
  }

  y += 2;
  y = escribirLineaMonto(doc, y, "Total haberes", totalHaberes, {
    x: x + 4,
    ancho: ancho - 8,
    lineHeight,
    colorTexto,
    colorPrimario,
  });

  if (descuentos > 0) {
    y = escribirLineaMonto(doc, y, "Total descuentos", descuentos, {
      x: x + 4,
      ancho: ancho - 8,
      lineHeight,
      colorTexto,
      colorPrimario,
    });
  }

  y = escribirLineaMonto(doc, y + 2, "Total a pagar", totalPagar, {
    x: x + 4,
    ancho: ancho - 8,
    lineHeight: 6,
    colorTexto,
    colorPrimario,
    destacado: true,
  });

  y += 4;

  y = escribirParrafo(
    doc,
    `Don(a) ${trabajadorNombre} declara haber analizado y estudiado detenidamente dicha liquidación, aceptándola en todas sus partes, sin tener observación alguna que formularle.`,
    y,
    { x, ancho, lineHeight, colorTexto, colorPrimario }
  );

  y = escribirParrafo(
    doc,
    `En consecuencia, el empleador paga a Don(a) ${trabajadorNombre} la suma de ${formato(totalPagar)}, que el trabajador declara recibir en este acto a su entera satisfacción. Las partes dejan constancia que la referida suma cubre el total de haberes especificados en la liquidación señalada en el numerando SEGUNDO del presente finiquito.`,
    y,
    { x, ancho, lineHeight, colorTexto, colorPrimario, titulo: "TERCERO:" }
  );

  y = escribirParrafo(
    doc,
    `Don(a) ${trabajadorNombre} deja constancia que durante el tiempo que prestó servicios a ${empresaNombre}, recibió oportunamente el total de las remuneraciones, beneficios y demás prestaciones convenidas de acuerdo a su contrato de trabajo, clase de trabajo ejecutado y disposiciones legales pertinentes, y que en tal virtud el empleador nada le adeuda por tales conceptos, ni por horas extraordinarias, asignación familiar, feriado, indemnización por años de servicios, imposiciones previsionales, así como por ningún otro concepto, ya sea legal o contractual, derivado de la prestación de sus servicios, de su contrato de trabajo o de la terminación del mismo, salvo los montos expresamente indicados en este finiquito.`,
    y,
    { x, ancho, lineHeight, colorTexto, colorPrimario, titulo: "CUARTO:" }
  );

  y = escribirParrafo(
    doc,
    `En virtud de lo anteriormente expuesto, Don(a) ${trabajadorNombre} manifiesta expresamente que ${empresaNombre} nada le adeuda en relación con los servicios prestados, con el contrato de trabajo o con motivo de la terminación del mismo, por lo que libre y espontáneamente, y con pleno conocimiento de sus derechos, otorga a su empleador el más amplio, completo, total y definitivo finiquito por los servicios prestados y por la terminación de ellos.`,
    y,
    { x, ancho, lineHeight, colorTexto, colorPrimario, titulo: "QUINTO:" }
  );

  y = escribirParrafo(
    doc,
    `Asimismo, declara el trabajador que, en todo caso y a todo evento, renuncia expresamente a cualquier derecho, acción o reclamo que eventualmente tuviere o pudiere corresponderle en contra del empleador, en relación directa o indirecta con su contrato de trabajo, con los servicios prestados, con la terminación del referido contrato o dichos servicios, ya sea que esos derechos o acciones correspondan a remuneraciones, cotizaciones previsionales, de seguridad social o de salud, subsidios, beneficios contractuales adicionales a las remuneraciones, indemnizaciones, compensaciones, o con cualquier otra causa o concepto. Para constancia, las partes firman el presente finiquito en ejemplares de igual tenor, quedando uno en poder de cada parte.`,
    y,
    { x, ancho, lineHeight, colorTexto, colorPrimario, titulo: "SEXTO:" }
  );

  if (texto(finiquito.observacion)) {
    y = escribirParrafo(doc, finiquito.observacion, y, {
      x,
      ancho,
      lineHeight,
      colorTexto,
      colorPrimario,
      titulo: "OBSERVACIÓN:",
    });
  }

  agregarFirmas(
    doc,
    y,
    {
      empresaNombre,
      empresaRut,
      representanteNombre,
      representanteRut,
      trabajadorNombre,
      trabajadorRut,
    },
    { colorTexto, colorPrimario }
  );

  agregarPiePaginas(doc);

  const nombreArchivo = `Finiquito_${limpiarNombreArchivo(
    trabajadorRut
  )}_${finiquito.periodo || ""}.pdf`;

  doc.save(nombreArchivo);
}
