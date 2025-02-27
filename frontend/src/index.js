// src/index.js
import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { ReactKeycloakProvider } from '@react-keycloak/web';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import keycloak from './services/keycloak';
import App from './App';
import './index.css';


const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: { main: '#1976d2' },
    grey: { 800: '#424242' },
    common: { white: '#fff' },
  },
  typography: {
    fontFamily: 'Roboto, sans-serif',
  },
});

const initOptions = {
  onLoad: 'login-required',  // força o login se o usuário não estiver autenticado
  checkLoginIframe: false    // desativa verificação via iframe (evita problemas em alguns ambientes)
};

const container = document.getElementById('root');
const root = createRoot(container);
root.render(
  <ReactKeycloakProvider authClient={keycloak} initOptions={initOptions}>
    <ThemeProvider theme={theme}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </ThemeProvider>
  </ReactKeycloakProvider>
);
