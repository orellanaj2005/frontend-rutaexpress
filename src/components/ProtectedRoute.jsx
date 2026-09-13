import { Navigate } from 'react-router-dom';
import { useIsAuthenticated } from '@azure/msal-react';
import { useRoles } from '../hooks/useRoles';

/**
 * Protege una ruta por autenticación y, opcionalmente, por rol.
 *
 * - Sin sesión -> redirige a /login.
 * - Con sesión pero sin el rol requerido -> muestra "acceso denegado" en vez
 *   de redirigir en silencio, para que quede claro que el problema es de
 *   permisos y no un bug de navegación (ver Caso 3, sección 6: cada pantalla
 *   lista explícitamente qué roles pueden entrar).
 */
export default function ProtectedRoute({ allowedRoles, children }) {
  const isAuthenticated = useIsAuthenticated();
  const { hasAnyRole } = useRoles();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !hasAnyRole(...allowedRoles)) {
    return (
      <div className="access-denied">
        <h2>Acceso denegado</h2>
        <p>Tu rol no tiene permiso para ver esta pantalla.</p>
      </div>
    );
  }

  return children;
}
