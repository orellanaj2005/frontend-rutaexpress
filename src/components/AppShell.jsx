import { NavLink, useNavigate } from 'react-router-dom';
import { useMsal } from '@azure/msal-react';
import { useRoles } from '../hooks/useRoles';

export default function AppShell({ children }) {
  const { instance, accounts } = useMsal();
  const { roles, isAuthenticated } = useRoles();
  const navigate = useNavigate();

  function handleLogout() {
    instance.logoutRedirect();
  }

  return (
    <div className="app-shell">
      <header className="app-header">
        <span className="brand">RutaExpress</span>
        {isAuthenticated && (
          <nav className="app-nav">
            <NavLink to="/dashboard">Dashboard</NavLink>
            <NavLink to="/shipments">Envíos</NavLink>
            {roles.some((r) => ['Admin', 'Despachador'].includes(r)) && (
              <NavLink to="/catalog">Catálogo</NavLink>
            )}
            {roles.includes('Admin') && <NavLink to="/reports">Reportería</NavLink>}
            {roles.some((r) => ['Admin', 'Auditor'].includes(r)) && (
              <NavLink to="/audit">Auditoría</NavLink>
            )}
          </nav>
        )}
        {isAuthenticated ? (
          <div className="account-box">
            <span>{accounts[0]?.name ?? accounts[0]?.username}</span>
            <button onClick={handleLogout}>Cerrar sesión</button>
          </div>
        ) : (
          <button onClick={() => navigate('/login')}>Iniciar sesión</button>
        )}
      </header>
      <main className="app-main">{children}</main>
    </div>
  );
}
