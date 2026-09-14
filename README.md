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


## Correr el build de producción

```bash
npm run build
npm run preview
```
