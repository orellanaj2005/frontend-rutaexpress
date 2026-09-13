import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { PublicClientApplication, EventType } from '@azure/msal-browser';
import { MsalProvider } from '@azure/msal-react';
import { msalConfig } from './auth/authConfig';
import App from './App';
import './index.css';

const msalInstance = new PublicClientApplication(msalConfig);

// Si ya hay una cuenta activa en cache (ej. al recargar la página), la
// marcamos como activa de una para que useMsal().accounts no venga vacío.
if (!msalInstance.getActiveAccount() && msalInstance.getAllAccounts().length > 0) {
  msalInstance.setActiveAccount(msalInstance.getAllAccounts()[0]);
}

// Cuando el login termina bien, MSAL dispara LOGIN_SUCCESS con la cuenta
// nueva — la marcamos activa para no tener que hacerlo a mano en cada página.
msalInstance.addEventCallback((event) => {
  if (event.eventType === EventType.LOGIN_SUCCESS && event.payload?.account) {
    msalInstance.setActiveAccount(event.payload.account);
  }
});

msalInstance.initialize().then(async () => {
  //  MSAL no sabe cuándo terminó de procesar el regreso desde
  // Microsoft (o un intento fallido/duplicado)
  // BrowserAuthError: interaction_in_progress en doble click o al recargar
  // en medio de un login.
  await msalInstance.handleRedirectPromise().catch((error) => {
    console.error('Error procesando el regreso de Azure AD:', error);
  });

  ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
      <MsalProvider instance={msalInstance}>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </MsalProvider>
    </React.StrictMode>
  );
});


