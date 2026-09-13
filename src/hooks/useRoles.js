import { useMsal } from '@azure/msal-react';

/**
 * Lee los App Roles directamente del claim "roles" del ID token (ver guía de
 * Javier, sección 2.3: Admin, Operador, Cliente, Auditor). Nunca hardcodear
 * el rol del usuario en el frontend — siempre viene del token.
 */
export function useRoles() {
  const { accounts } = useMsal();
  const account = accounts[0];
  const roles = account?.idTokenClaims?.roles ?? [];

  return {
    roles,
    hasRole: (role) => roles.includes(role),
    hasAnyRole: (...allowed) => allowed.some((r) => roles.includes(r)),
    isAuthenticated: !!account,
  };
}
