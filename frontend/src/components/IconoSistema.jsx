export default function IconoSistema({ tipo = "documento", size = 22 }) {
  const props = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    "aria-hidden": "true",
  };

  const iconos = {
    trabajador: (
      <svg {...props}>
        <path d="M16 21v-2a4 4 0 0 0-8 0v2" />
        <path d="M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z" />
      </svg>
    ),
    trabajadores: (
      <svg {...props}>
        <path d="M16 21v-2a4 4 0 0 0-8 0v2" />
        <path d="M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z" />
        <path d="M20 21v-2a3 3 0 0 0-2-2.8" />
        <path d="M17 4.2a3 3 0 0 1 0 5.6" />
      </svg>
    ),
    liquidacion: (
      <svg {...props}>
        <path d="M8 3h8l4 4v14H8z" />
        <path d="M16 3v5h4" />
        <path d="M11 13h6" />
        <path d="M11 17h4" />
      </svg>
    ),
    comprobante: (
      <svg {...props}>
        <path d="M7 3h10v18l-2-1-2 1-2-1-2 1-2-1z" />
        <path d="M9 8h6" />
        <path d="M9 12h6" />
        <path d="M9 16h4" />
      </svg>
    ),
    dinero: (
      <svg {...props}>
        <path d="M4 7h16v10H4z" />
        <path d="M8 12h.01" />
        <path d="M16 12h.01" />
        <path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z" />
      </svg>
    ),
    banco: (
      <svg {...props}>
        <path d="M3 10h18" />
        <path d="M5 10v8" />
        <path d="M9 10v8" />
        <path d="M15 10v8" />
        <path d="M19 10v8" />
        <path d="M4 18h16" />
        <path d="M12 3 4 8h16z" />
      </svg>
    ),
    balance: (
      <svg {...props}>
        <path d="M4 19h16" />
        <path d="M7 19V9" />
        <path d="M12 19V5" />
        <path d="M17 19v-7" />
      </svg>
    ),
    ok: (
      <svg {...props}>
        <path d="m5 13 4 4L19 7" />
      </svg>
    ),
    alerta: (
      <svg {...props}>
        <path d="M12 9v4" />
        <path d="M12 17h.01" />
        <path d="m10.3 4.3-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.7-2.7l-8-14a2 2 0 0 0-3.4 0z" />
      </svg>
    ),
    configuracion: (
      <svg {...props}>
        <path d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7z" />
        <path d="M19.4 15a1.8 1.8 0 0 0 .36 1.98l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06A1.8 1.8 0 0 0 15 19.4a1.8 1.8 0 0 0-1 .6l-.08.08a2 2 0 1 1-3.84 0L10 20a1.8 1.8 0 0 0-1-.6 1.8 1.8 0 0 0-1.98.36l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.8 1.8 0 0 0 4.6 15a1.8 1.8 0 0 0-.6-1l-.08-.08a2 2 0 1 1 0-3.84L4 10a1.8 1.8 0 0 0 .6-1 1.8 1.8 0 0 0-.36-1.98l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.8 1.8 0 0 0 9 4.6a1.8 1.8 0 0 0 1-.6l.08-.08a2 2 0 1 1 3.84 0L14 4a1.8 1.8 0 0 0 1 .6 1.8 1.8 0 0 0 1.98-.36l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.8 1.8 0 0 0 19.4 9c0 .38.22.73.6 1l.08.08a2 2 0 1 1 0 3.84L20 14c-.38.27-.6.62-.6 1z" />
      </svg>
    ),
    vacaciones: (
      <svg {...props}>
        <path d="M4 18c3-4 6-6 9-6s5 2 7 6" />
        <path d="M12 12V4" />
        <path d="M8 8c1-2 3-4 4-4s3 2 4 4" />
        <path d="M7 20h10" />
      </svg>
    ),
    licencia: (
      <svg {...props}>
        <path d="M8 3h8v5h5v13H3V8h5z" />
        <path d="M12 10v7" />
        <path d="M8.5 13.5h7" />
      </svg>
    ),
    permiso: (
      <svg {...props}>
        <path d="M6 3h9l3 3v15H6z" />
        <path d="M15 3v4h4" />
        <path d="M9 13h6" />
        <path d="M9 17h4" />
      </svg>
    ),
    descuento: (
      <svg {...props}>
        <path d="M4 7h16" />
        <path d="M4 17h16" />
        <path d="M7 4l10 16" />
      </svg>
    ),
    calendario: (
      <svg {...props}>
        <path d="M7 3v4" />
        <path d="M17 3v4" />
        <path d="M4 8h16" />
        <path d="M5 5h14v16H5z" />
      </svg>
    ),
    copiar: (
      <svg {...props}>
        <path d="M8 8h11v13H8z" />
        <path d="M5 16H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h11a1 1 0 0 1 1 1v1" />
      </svg>
    ),
    guardar: (
      <svg {...props}>
        <path d="M5 3h12l2 2v16H5z" />
        <path d="M8 3v6h8V3" />
        <path d="M8 21v-7h8v7" />
      </svg>
    ),
    agregar: (
      <svg {...props}>
        <path d="M12 5v14" />
        <path d="M5 12h14" />
      </svg>
    ),
    familia: (
      <svg {...props}>
        <path d="M9 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6z" />
        <path d="M17 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6z" />
        <path d="M3 21v-2a5 5 0 0 1 10 0v2" />
        <path d="M13 21v-2a5 5 0 0 1 8 0v2" />
      </svg>
    ),
  };

  return iconos[tipo] || iconos.comprobante;
}
