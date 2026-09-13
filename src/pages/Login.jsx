import { useNavigate } from 'react-router-dom';
import { useIsAuthenticated, useMsal } from '@azure/msal-react';
import { useEffect } from 'react';
import { loginRequest } from '../auth/authConfig';

export default function Login() {
  const { instance } = useMsal();
  const isAuthenticated = useIsAuthenticated();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  function handleLogin() {
    // Redirect en vez de popup: más confiable en navegadores que bloquean
    // popups, y es el patrón que usa MSAL por defecto en sus ejemplos.
    instance.loginRedirect(loginRequest);
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <h1>RutaExpress</h1>
        <p>Plataforma unificada de envíos de última milla</p>
        <button className="ms-login-button" onClick={handleLogin}>
          Iniciar sesión con Microsoft
        </button>
      </div>
    </div>
  );
}
