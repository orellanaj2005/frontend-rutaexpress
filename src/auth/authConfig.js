// Configuración de Azure AD para MSAL.
// Todos los valores salen de variables de entorno (ver .env.example) para
// no dejar IDs de Azure hardcodeados en el código fuente.
//
// IMPORTANTE (ver Caso RutaExpress, sección 4 y guía de Javier, sección 2.5):
// - VITE_TENANT_ID y VITE_SPA_CLIENT_ID te los pasa Javier tras registrar
//   la SPA en Azure AD.
// - El redirectUri configurado aquí DEBE coincidir EXACTO con el que Javier
//   registró en el App Registration de la SPA (http://localhost:5173, porque
//   confirmaron que el equipo usa Vite).

export const msalConfig = {
  auth: {
    clientId: import.meta.env.VITE_SPA_CLIENT_ID,
    authority: `https://login.microsoftonline.com/${import.meta.env.VITE_TENANT_ID}`,
    redirectUri: import.meta.env.VITE_REDIRECT_URI || 'http://localhost:5173',
    postLogoutRedirectUri: import.meta.env.VITE_REDIRECT_URI || 'http://localhost:5173',
  },
  cache: {
    // sessionStorage en vez de localStorage: el token no sobrevive a cerrar
    // la pestaña, lo cual es el comportamiento más seguro por defecto.
    cacheLocation: 'sessionStorage',
    storeAuthStateInCookie: false,
  },
};

// Scope de la API (ver guía de Javier, sección 2.2: "access_as_user" expuesto
// en el App Registration de RutaExpress-API). Sin este scope, MSAL no puede
// pedir un token que el BFF acepte como audience.
export const loginRequest = {
  scopes: ['openid', 'profile', import.meta.env.VITE_API_SCOPE],
};

// URL base del BFF (ver Caso RutaExpress, sección 4: "el flujo de llamadas
// seguras es siempre JWT -> API Gateway -> bff -> microservicio"). En local
// le pegas directo al BFF; en producción, a la Invoke URL de API Gateway.
export const apiConfig = {
  baseUrl: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080',
};
