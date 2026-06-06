# ServContable PRO - Version demo

La version demo permite mostrar el sistema a potenciales clientes sin abrir el registro publico ni usar datos reales.

## Como funciona

- El login muestra un boton `Ingresar a version demo` solo si el frontend se compila con `VITE_DEMO_MODE=true`.
- El backend permite el endpoint `/api/auth/demo-login` solo si `DEMO_MODE=true`.
- Al ingresar, el backend crea o actualiza automaticamente:
  - Usuario demo: `demo@servcontable.cl`
  - Empresa demo: `EMPRESA DEMO SERVCONTABLE SpA`
- El usuario demo queda asignado como administrador de la empresa demo.

## Recomendacion importante

Usar una base de datos separada para demo, por ejemplo:

```text
servcontable_demo
```

No usar la misma base de datos de clientes reales.

## Backend demo

Copiar:

```powershell
backend/.env.demo.example -> backend/.env
```

Ajustar estos valores:

```env
DATABASE_URL=postgresql://usuario:password@host:5432/servcontable_demo
JWT_SECRET=clave_demo_larga_y_privada
DEMO_MODE=true
CORS_ORIGIN=https://demo.tu-dominio.cl
```

Luego iniciar backend:

```powershell
cd backend
npm start
```

## Frontend demo

El archivo `frontend/.env.demo` activa el boton demo.

Compilar demo:

```powershell
npm run build:demo
```

O desde frontend:

```powershell
cd frontend
npm run build:demo
```

Publicar el contenido de:

```text
frontend/dist
```

## URLs sugeridas

- Demo frontend: `https://demo.tu-dominio.cl`
- Demo API: `https://api-demo.tu-dominio.cl/api`
- Produccion frontend: `https://app.tu-dominio.cl`
- Produccion API: `https://api.tu-dominio.cl/api`

## Seguridad

- Mantener `ALLOW_PUBLIC_REGISTRATION=false`.
- No usar la base real de clientes.
- Cambiar `JWT_SECRET` de demo.
- Reiniciar o limpiar la base demo periodicamente si quieres partir desde cero.
