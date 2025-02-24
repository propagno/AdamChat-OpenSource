import React, { useEffect } from 'react';
import { getCodeFromUrl, exchangeCodeForToken, login } from './services/auth';

const App = () => {
  useEffect(() => {
    const code = getCodeFromUrl();
    const backendUrl = process.env.REACT_APP_BACKEND_URL;
    if (code) {
      exchangeCodeForToken(code)
        .then(() => {
          window.history.replaceState({}, document.title, "/");
          window.location.href = `${backendUrl}/dashboard`;
        })
        .catch((err) => console.error("Erro na troca de token:", err));
    } else {
      const token = localStorage.getItem('id_token');
      if (!token) {
        login();
      } else {
        window.location.href = `${backendUrl}/dashboard`;
      }
    }
  }, []);

  return <h1>Bem-vindo ao AdamChat</h1>;
};

export default App;
