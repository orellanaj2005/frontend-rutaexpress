import axios from 'axios';
import { InteractionRequiredAuthError } from '@azure/msal-browser';
import { loginRequest, apiConfig } from '../auth/authConfig';

/**
 * Cliente HTTP compartido para todas las llamadas al BFF. El interceptor de
 * request adjunta el header Authorization: Bearer <token> a cada llamada
 * (ver Caso RutaExpress, sección 4: "MSAL Angular/React: proteger rutas y
 * adjuntar Bearer <access_token> a cada request").
 *
 * createHttpClient recibe la instancia de MSAL porque acquireTokenSilent
 * necesita el msalInstance real, que solo está disponible dentro de
 * componentes vía useMsal() — no se puede importar como singleton estático.
 */
export function createHttpClient(msalInstance) {
  const client = axios.create({
    baseURL: apiConfig.baseUrl,
  });

  client.interceptors.request.use(async (config) => {
    const account = msalInstance.getActiveAccount();
    if (!account) {
      throw new Error('No hay una cuenta activa: el usuario no ha iniciado sesión.');
    }

    try {
      const result = await msalInstance.acquireTokenSilent({
        ...loginRequest,
        account,
      });
      config.headers.Authorization = `Bearer ${result.accessToken}`;
    } catch (error) {
      // El token expiró y no se pudo renovar en silencio (ej. la sesión de
      // Azure AD también expiró) -> fuerza un login interactivo.
      if (error instanceof InteractionRequiredAuthError) {
        await msalInstance.acquireTokenRedirect(loginRequest);
      }
      throw error;
    }

    return config;
  });

  // Si el BFF responde 403 (rol sin permiso, ver SecurityConfig del BFF),
  // no lo tratamos como error de red silencioso: lo dejamos pasar tal cual
  // para que cada pantalla decida cómo mostrarlo.
  client.interceptors.response.use(
    (response) => response,
    (error) => Promise.reject(error)
  );

  return client;
}
