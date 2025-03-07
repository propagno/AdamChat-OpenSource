import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import NoAuthApp from './no-auth-app';
import reportWebVitals from './reportWebVitals';

// Este é um ponto de entrada de emergência que não usa o sistema de autenticação padrão
// para casos onde a autenticação está causando problemas
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <NoAuthApp />
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals(); 