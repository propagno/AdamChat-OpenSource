import React from 'react';
import { createRoot } from 'react-dom/client';
import { ReactKeycloakProvider } from '@react-keycloak/web';
import Keycloak from 'keycloak-js';
import App from './App';

const keycloak = new Keycloak({
  url: 'http://localhost:8080',  // Use 'http://localhost:8080' se sua instância não exigir /auth
  realm: 'AdamChat',
  clientId: 'adamchat-frontend'
});

const container = document.getElementById('root');
const root = createRoot(container);
root.render(
  <ReactKeycloakProvider authClient={keycloak}>
    <App />
  </ReactKeycloakProvider>
);
