// src/index.js
import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { ReactKeycloakProvider } from '@react-keycloak/web';
import keycloak from './services/keycloak';
import App from './App';

const initOptions = {
  onLoad: 'login-required',  // força o login se o usuário não estiver autenticado
  checkLoginIframe: false    // desativa verificação via iframe (evita problemas em alguns ambientes)
};

const container = document.getElementById('root');
const root = createRoot(container);
root.render(
  <ReactKeycloakProvider authClient={keycloak} initOptions={initOptions}>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </ReactKeycloakProvider>
);
