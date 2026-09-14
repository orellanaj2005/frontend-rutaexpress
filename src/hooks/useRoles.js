
import { useEffect, useState } from 'react';
import { useMsal } from '@azure/msal-react';
import { loginRequest } from '../auth/authConfig';

/**
 * Decodifica el payload de un JWT (sin verificar firma — eso ya lo hizo
 * Azure AD, acá solo queremos leer los claims). Evita agregar una
 * dependencia extra solo para esto.
 */
function decodeJwtPayload(token) {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const json = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + c.charCodeAt(0).toString(16).padStart(2, '0'))
        .join('')
    );
    return JSON.parse(json);
  } catch {
    return {};
  }
}

/**
 * IMPORTANTE: los roles se leen del ACCESS TOKEN (el que se usa para
 * llamar al BFF), no del ID token. Azure AD solo incluye el claim "roles"
 * en un token si el usuario tiene ese rol asignado para la audiencia de
 * ESE token — y el rol de RutaExpress está asignado sobre la Enterprise
 * Application de la API, no sobre la del frontend/SPA. El ID token
 * (audience = SPA client) llega sin roles aunque el usuario sí tenga uno
 * asignado para la API.
 */
export function useRoles() {
  const { instance, accounts } = useMsal();
  const account = accounts[0];
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!account) {
      setRoles([]);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);

    instance
      .acquireTokenSilent({ ...loginRequest, account })
      .then((result) => {
        if (cancelled) return;
        const claims = decodeJwtPayload(result.accessToken);
        setRoles(claims.roles ?? []);
      })
      .catch(() => {
        if (!cancelled) setRoles([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [instance, account]);

  return {
    roles,
    loading,
    hasRole: (role) => roles.includes(role),
    hasAnyRole: (...allowed) => allowed.some((r) => roles.includes(r)),
    isAuthenticated: !!account,
  };
}


