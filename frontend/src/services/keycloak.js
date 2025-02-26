// src/services/keycloak.js
import Keycloak from 'keycloak-js';

const keycloak = new Keycloak({
  url: process.env.REACT_APP_KEYCLOAK_URL || 'http://localhost:8080',
  realm: process.env.REACT_APP_KEYCLOAK_REALM || 'AdamChat',
  clientId: process.env.REACT_APP_KEYCLOAK_CLIENT_ID || 'adamchat-frontend'
});

// Configura o callback para redirecionar após o logout
keycloak.onAuthLogout = () => {
  window.location.href = 'http://localhost:3002/';
};

export default keycloak;
