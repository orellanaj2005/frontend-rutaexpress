import { useNavigate } from 'react-router-dom';
import { useIsAuthenticated, useMsal } from '@azure/msal-react';
import { useEffect, useState } from 'react';
import { loginRequest } from '../auth/authConfig';

export default function Login() {
  const { instance, inProgress } = useMsal();
  const isAuthenticated = useIsAuthenticated();
  const navigate = useNavigate();
  const [starting, setStarting] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  function handleLogin() {
    if (starting || inProgress !== 'none') return; // evita doble click mientras ya arrancó
    setStarting(true);
    // Redirect en vez de popup: más confiable en navegadores que bloquean
    // popups, y es el patrón que usa MSAL por defecto en sus ejemplos.
    instance.loginRedirect(loginRequest).catch((error) => {
      console.error('Error al iniciar el login:', error);
      setStarting(false);
    });
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <h1>RutaExpress</h1>
        <p>Plataforma unificada de envíos de última milla</p>
        <button className="ms-login-button" onClick={handleLogin} disabled={starting || inProgress !== 'none'}>
          {starting ? 'Redirigiendo…' : 'Iniciar sesión con Microsoft'}
        </button>
      </div>
    </div>
  );
}