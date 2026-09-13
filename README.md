# frontend-rutaexpress

Frontend de RutaExpress en React + Vite, con login corporativo vía Azure AD
(MSAL) y rutas protegidas por rol.

## Setup

```bash
npm install
cp .env.example .env
```

Completa `.env` con los valores reales (`VITE_TENANT_ID` y `VITE_SPA_CLIENT_ID`
te los pasa Javier). El `VITE_API_SCOPE` y `VITE_REDIRECT_URI` de ejemplo ya
están con los datos que compartió el equipo — solo confirma que el
`redirectUri` calce EXACTO con el que Javier registró en el App Registration
de la SPA en Azure AD.

```bash
npm run dev
```

Abre `http://localhost:5173`.

## Ojo con esto (nota para no confundirse)

El scope de login (`VITE_API_SCOPE`) se usa **con** el prefijo `api://`:
```
api://5af865ec-.../access_as_user
```
Esto es distinto al backend, donde el `API_CLIENT_ID` que se usa para
validar el audience va **sin** el prefijo. No es un error — son dos usos
distintos del mismo ID: acá se usa para pedirle el scope a Azure AD, allá se
usa para comparar contra el claim `aud` del token ya emitido.

## Estructura

```
src/
  auth/authConfig.js      -> configuración de MSAL (msalConfig, loginRequest)
  hooks/useRoles.js        -> lee el claim "roles" del token
  hooks/useApi.js          -> cliente HTTP con el Bearer token ya adjunto
  api/httpClient.js        -> interceptor de axios (acquireTokenSilent)
  components/ProtectedRoute.jsx -> guard de rutas por rol
  components/AppShell.jsx  -> layout + navegación condicional por rol
  pages/                    -> Login, Dashboard, Shipments, Catalog, Reports, Audit
```

## Pendiente / a confirmar con el equipo

- [ ] Confirmar con Javier el `VITE_API_BASE_URL` real una vez que el BFF
      esté desplegado (por ahora apunta a `http://localhost:8080`).
- [ ] Los nombres de campo que espera cada endpoint (`shipmentId`, `status`,
      etc.) — ajustar las páginas si el contrato real del BFF difiere.
- [ ] Catálogo: falta la UI de edición de tarifa/capacidad para Admin (por
      ahora solo lista).
- [ ] Probar el flujo completo con un usuario de cada rol (Admin, Operador,
      Cliente, Auditor) una vez que Azure AD tenga usuarios de prueba
      asignados a cada uno (ver guía de Javier, sección 2.3).

## Correr el build de producción

```bash
npm run build
npm run preview
```
