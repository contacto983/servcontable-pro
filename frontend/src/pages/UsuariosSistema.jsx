import { useEffect, useMemo, useState } from "react";
import {
  listarUsuariosSistema,
  crearUsuarioSistema,
  cambiarEstadoUsuario,
  resetearPasswordUsuario,
  obtenerUsuarioActual,
} from "../services/authService";
import { listarEmpresas } from "../services/empresaService";

const ROLES_ADMIN_SISTEMA = ["admin", "superadmin", "administrador_sistema"];
const ROLES_ADMIN_CLIENTE = ["admin_cliente", "cliente_admin"];
const ROLES_DEMO = ["usuario_demo", "demo", "cliente_demo"];

function rolNormalizado(rol = "") {
  return String(rol || "").trim().toLowerCase();
}

function esAdminSistema(rol = "") {
  return ROLES_ADMIN_SISTEMA.includes(rolNormalizado(rol));
}

function puedeGestionarUsuarios(rol = "") {
  const rolActual = rolNormalizado(rol);
  return esAdminSistema(rolActual) || ROLES_ADMIN_CLIENTE.includes(rolActual);
}

function nombreRol(rol = "") {
  const rolActual = rolNormalizado(rol);

  if (esAdminSistema(rolActual)) return "Administrador sistema";
  if (ROLES_ADMIN_CLIENTE.includes(rolActual)) return "Administrador cliente";
  if (ROLES_DEMO.includes(rolActual)) return "Usuario demo";
  return "Usuario cliente";
}

function empresasAsignadas(usuario) {
  const empresas = Array.isArray(usuario?.empresas) ? usuario.empresas : [];

  if (empresas.length === 0) {
    return "Sin empresas asignadas";
  }

  return empresas
    .map((empresa) => {
      const nombre = empresa.razon_social || empresa.nombre || "Empresa";
      const rolEmpresa = empresa.rol_empresa ? ` (${empresa.rol_empresa})` : "";
      return `${nombre}${rolEmpresa}`;
    })
    .join(", ");
}

export default function UsuariosSistema() {
  const usuarioActual = obtenerUsuarioActual();
  const adminSistema = esAdminSistema(usuarioActual?.rol);
  const puedeGestionar = puedeGestionarUsuarios(usuarioActual?.rol);

  const [usuarios, setUsuarios] = useState([]);
  const [empresas, setEmpresas] = useState([]);
  const [empresaFiltro, setEmpresaFiltro] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);

  const [formulario, setFormulario] = useState({
    nombre: "",
    email: "",
    password: "",
    rol: "usuario_cliente",
    empresa_id: "",
    rol_empresa: "usuario",
  });

  const rolesDisponibles = useMemo(() => {
    const roles = [
      { valor: "usuario_cliente", label: "Usuario cliente" },
      { valor: "usuario_demo", label: "Usuario demo" },
      { valor: "admin_cliente", label: "Administrador cliente" },
    ];

    if (adminSistema) {
      roles.unshift({ valor: "superadmin", label: "Administrador sistema" });
    }

    return roles;
  }, [adminSistema]);

  useEffect(() => {
    cargarDatos();
  }, []);

  async function cargarDatos() {
    try {
      setCargando(true);
      setError("");
      setMensaje("");

      const [datosEmpresas, datosUsuarios] = await Promise.all([
        listarEmpresas(),
        listarUsuariosSistema(empresaFiltro),
      ]);

      const listaEmpresas = Array.isArray(datosEmpresas?.empresas)
        ? datosEmpresas.empresas
        : [];

      setEmpresas(listaEmpresas);
      setUsuarios(Array.isArray(datosUsuarios?.usuarios) ? datosUsuarios.usuarios : []);

      if (!adminSistema && !formulario.empresa_id && listaEmpresas.length > 0) {
        setFormulario((actual) => ({
          ...actual,
          empresa_id: String(listaEmpresas[0].id),
        }));
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setCargando(false);
    }
  }

  async function buscarUsuarios() {
    try {
      setCargando(true);
      setError("");
      setMensaje("");

      const data = await listarUsuariosSistema(empresaFiltro);
      setUsuarios(Array.isArray(data?.usuarios) ? data.usuarios : []);
    } catch (err) {
      setError(err.message);
    } finally {
      setCargando(false);
    }
  }

  function manejarCambio(e) {
    const { name, value } = e.target;

    setFormulario((actual) => ({
      ...actual,
      [name]: value,
    }));
  }

  async function guardarUsuario(e) {
    e.preventDefault();

    try {
      setError("");
      setMensaje("");

      const esSuperadmin = formulario.rol === "superadmin";
      const datos = {
        nombre: formulario.nombre.trim(),
        email: formulario.email.trim().toLowerCase(),
        password: formulario.password,
        rol: formulario.rol,
        empresa_id: esSuperadmin ? null : formulario.empresa_id,
        rol_empresa: esSuperadmin ? null : formulario.rol_empresa,
      };

      await crearUsuarioSistema(datos);

      setFormulario((actual) => ({
        ...actual,
        nombre: "",
        email: "",
        password: "",
        rol: "usuario_cliente",
        rol_empresa: "usuario",
      }));

      setMensaje("Usuario creado correctamente. Ya puede ingresar con su correo y clave inicial.");
      await buscarUsuarios();
    } catch (err) {
      setError(err.message);
    }
  }

  async function alternarEstado(usuario) {
    try {
      setError("");
      setMensaje("");

      await cambiarEstadoUsuario(usuario.id, !usuario.activo);
      setMensaje(usuario.activo ? "Usuario desactivado." : "Usuario activado.");
      await buscarUsuarios();
    } catch (err) {
      setError(err.message);
    }
  }

  async function cambiarClave(usuario) {
    const nuevaClave = window.prompt(
      `Nueva contrasena temporal para ${usuario.email}. Minimo 6 caracteres:`
    );

    if (!nuevaClave) {
      return;
    }

    try {
      setError("");
      setMensaje("");

      await resetearPasswordUsuario(usuario.id, nuevaClave);
      setMensaje("Contrasena temporal actualizada correctamente.");
    } catch (err) {
      setError(err.message);
    }
  }

  if (!puedeGestionar) {
    return (
      <div>
        <h1 style={titulo}>Usuarios y accesos</h1>
        <p style={errorTexto}>No tienes permisos para administrar usuarios.</p>
      </div>
    );
  }

  return (
    <div>
      <h1 style={titulo}>Usuarios y accesos</h1>
      <p style={subtitulo}>
        Crea accesos para clientes y asigna que empresas puede ver cada usuario.
      </p>

      {mensaje && <p style={ok}>{mensaje}</p>}
      {error && <p style={errorTexto}>{error}</p>}

      <div style={gridPrincipal}>
        <form style={card} onSubmit={guardarUsuario}>
          <h2 style={tituloSeccion}>Crear acceso</h2>

          <div style={gridFormulario}>
            <div>
              <label style={label}>Nombre</label>
              <input
                style={input}
                name="nombre"
                value={formulario.nombre}
                onChange={manejarCambio}
                placeholder="Nombre del usuario"
              />
            </div>

            <div>
              <label style={label}>Correo</label>
              <input
                style={input}
                name="email"
                type="email"
                value={formulario.email}
                onChange={manejarCambio}
                placeholder="cliente@empresa.cl"
              />
            </div>

            <div>
              <label style={label}>Clave inicial</label>
              <input
                style={input}
                name="password"
                type="password"
                value={formulario.password}
                onChange={manejarCambio}
                placeholder="Minimo 6 caracteres"
              />
            </div>

            <div>
              <label style={label}>Rol del sistema</label>
              <select
                style={input}
                name="rol"
                value={formulario.rol}
                onChange={manejarCambio}
              >
                {rolesDisponibles.map((rol) => (
                  <option key={rol.valor} value={rol.valor}>
                    {rol.label}
                  </option>
                ))}
              </select>
            </div>

            {formulario.rol !== "superadmin" && (
              <>
                <div>
                  <label style={label}>Empresa asignada</label>
                  <select
                    style={input}
                    name="empresa_id"
                    value={formulario.empresa_id}
                    onChange={manejarCambio}
                  >
                    {adminSistema && (
                      <option value="">Sin empresa inicial</option>
                    )}
                    {empresas.length === 0 && (
                      <option value="">No hay empresas disponibles</option>
                    )}
                    {empresas.map((empresa) => (
                      <option key={empresa.id} value={empresa.id}>
                        {empresa.razon_social || empresa.nombre || "Empresa"}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={label}>Permiso en empresa</label>
                  <select
                    style={input}
                    name="rol_empresa"
                    value={formulario.rol_empresa}
                    onChange={manejarCambio}
                  >
                    <option value="usuario">Usuario</option>
                    <option value="admin">Administrador</option>
                  </select>
                </div>
              </>
            )}
          </div>

          <button style={botonGuardar} type="submit">
            Crear usuario
          </button>
        </form>

        <div style={cardInfo}>
          <h2 style={tituloSeccion}>Como queda el acceso</h2>
          <p style={textoInfo}>
            El administrador general de ServContable ve todas las empresas. Un
            cliente solo ve las empresas que se le asignen en esta pantalla.
          </p>
          <p style={textoInfo}>
            Recomendacion comercial: crear una clave temporal y pedir al cliente
            cambiarla al primer ingreso.
          </p>
        </div>
      </div>

      <div style={cardTabla}>
        <div style={cabeceraTabla}>
          <h2 style={tituloSeccion}>Usuarios registrados</h2>

          <div style={filtros}>
            <select
              style={inputFiltro}
              value={empresaFiltro}
              onChange={(e) => setEmpresaFiltro(e.target.value)}
            >
              <option value="">Todas las empresas</option>
              {empresas.map((empresa) => (
                <option key={empresa.id} value={empresa.id}>
                  {empresa.razon_social || empresa.nombre || "Empresa"}
                </option>
              ))}
            </select>

            <button style={botonBuscar} type="button" onClick={buscarUsuarios}>
              Buscar
            </button>
          </div>
        </div>

        {cargando && <p style={subtitulo}>Cargando usuarios...</p>}

        <div style={{ overflowX: "auto" }}>
          <table style={tabla}>
            <thead>
              <tr>
                <th style={th}>Usuario</th>
                <th style={th}>Correo</th>
                <th style={th}>Rol</th>
                <th style={th}>Empresas</th>
                <th style={th}>Estado</th>
                <th style={th}>Accion</th>
              </tr>
            </thead>

            <tbody>
              {usuarios.map((usuario) => (
                <tr key={usuario.id}>
                  <td style={td}>{usuario.nombre}</td>
                  <td style={td}>{usuario.email}</td>
                  <td style={td}>{nombreRol(usuario.rol)}</td>
                  <td style={td}>{empresasAsignadas(usuario)}</td>
                  <td style={td}>
                    <span style={usuario.activo ? badgeActivo : badgeInactivo}>
                      {usuario.activo ? "Activo" : "Inactivo"}
                    </span>
                  </td>
                  <td style={tdAccion}>
                    <button
                      type="button"
                      title="Cambiar clave"
                      aria-label="Cambiar clave"
                      style={botonIconoAzul}
                      onClick={() => cambiarClave(usuario)}
                    >
                      {"\uD83D\uDD11"}
                    </button>
                    <button
                      type="button"
                      title={usuario.activo ? "Desactivar" : "Activar"}
                      aria-label={usuario.activo ? "Desactivar usuario" : "Activar usuario"}
                      style={usuario.activo ? botonIconoRojo : botonIconoVerde}
                      onClick={() => alternarEstado(usuario)}
                    >
                      {usuario.activo ? "\u2715" : "\u2713"}
                    </button>
                  </td>
                </tr>
              ))}

              {usuarios.length === 0 && !cargando && (
                <tr>
                  <td style={td} colSpan="6">
                    No hay usuarios para el filtro seleccionado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
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
  marginBottom: "20px",
};

const gridPrincipal = {
  display: "grid",
  gridTemplateColumns: "minmax(0, 1fr) 360px",
  gap: "20px",
  alignItems: "start",
};

const card = {
  background: "white",
  borderRadius: "18px",
  padding: "24px",
  boxShadow: "0 14px 32px rgba(3, 105, 161, 0.12)",
};

const cardInfo = {
  ...card,
  border: "1px solid #67e8f9",
  background: "#f0f9ff",
};

const cardTabla = {
  ...card,
  marginTop: "22px",
};

const tituloSeccion = {
  color: "#0369a1",
  marginTop: 0,
};

const gridFormulario = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
  gap: "14px",
};

const label = {
  display: "block",
  fontWeight: "bold",
  color: "#1e293b",
  marginBottom: "6px",
};

const input = {
  width: "100%",
  padding: "12px",
  borderRadius: "10px",
  border: "1px solid #a9d8ef",
  boxSizing: "border-box",
};

const inputFiltro = {
  ...input,
  minWidth: "240px",
};

const botonGuardar = {
  background: "#10b981",
  color: "white",
  border: "none",
  padding: "13px 18px",
  borderRadius: "12px",
  fontWeight: "bold",
  cursor: "pointer",
  marginTop: "18px",
};

const botonBuscar = {
  background: "#0369a1",
  color: "white",
  border: "none",
  padding: "12px 18px",
  borderRadius: "10px",
  fontWeight: "bold",
  cursor: "pointer",
};

const cabeceraTabla = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: "16px",
  flexWrap: "wrap",
};

const filtros = {
  display: "flex",
  gap: "10px",
  alignItems: "center",
  flexWrap: "wrap",
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
  whiteSpace: "nowrap",
};

const td = {
  padding: "12px",
  borderBottom: "1px solid #e2e8f0",
  color: "#1e293b",
  verticalAlign: "top",
};

const tdAccion = {
  ...td,
  display: "flex",
  gap: "8px",
  justifyContent: "center",
  whiteSpace: "nowrap",
};

const badgeActivo = {
  background: "#dcfce7",
  color: "#166534",
  borderRadius: "999px",
  padding: "5px 9px",
  fontWeight: "bold",
  fontSize: "12px",
};

const badgeInactivo = {
  background: "#fee2e2",
  color: "#991b1b",
  borderRadius: "999px",
  padding: "5px 9px",
  fontWeight: "bold",
  fontSize: "12px",
};

const botonIconoAzul = {
  width: "32px",
  height: "32px",
  border: "none",
  borderRadius: "9px",
  background: "linear-gradient(135deg, #0369a1, #06b6d4)",
  color: "white",
  fontWeight: "bold",
  cursor: "pointer",
  padding: 0,
  lineHeight: 1,
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: "15px",
};

const botonIconoRojo = {
  ...botonIconoAzul,
  background: "linear-gradient(135deg, #ef4444, #f97316)",
};

const botonIconoVerde = {
  ...botonIconoAzul,
  background: "linear-gradient(135deg, #10b981, #06b6d4)",
};

const textoInfo = {
  color: "#1e293b",
  lineHeight: "1.45",
};

const ok = {
  color: "#10b981",
  fontWeight: "bold",
};

const errorTexto = {
  color: "#ef4444",
  fontWeight: "bold",
};
