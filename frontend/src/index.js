// src/index.js
// Apply MUI patches first (before any other imports)
import './patches/patchMUI';
import './mui-fix';
import './mui-override.css';

import React from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';

// Container raiz para renderização do React
const rootElement = document.getElementById('root');

// Função para renderizar a aplicação com tratamento de erro
const renderApp = () => {
  try {
    const root = createRoot(rootElement);
    root.render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
    console.log('Aplicação renderizada com sucesso');
  } catch (error) {
    console.error('Erro ao renderizar a aplicação:', error);
    
    // Mostrar uma mensagem de erro amigável se a renderização falhar
    rootElement.innerHTML = `
      <div style="
        font-family: system-ui, -apple-system, sans-serif;
        max-width: 500px;
        margin: 50px auto;
        padding: 20px;
        text-align: center;
        background-color: #fff;
        border-radius: 8px;
        box-shadow: 0 2px 10px rgba(0,0,0,0.1);
      ">
        <h1 style="color: #d32f2f;">Erro na Aplicação</h1>
        <p>Desculpe, encontramos um problema ao iniciar a aplicação.</p>
        <button 
          onclick="window.location.reload()" 
          style="
            background: #3f51b5;
            color: white;
            border: none;
            padding: 10px 20px;
            margin-top: 20px;
            border-radius: 4px;
            cursor: pointer;
          "
        >
          Recarregar Página
        </button>
      </div>
    `;
  }
};

// Inicia a renderização
renderApp();

// Reporte métricas web
reportWebVitals();
