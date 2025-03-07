// src/components/LoginButton.js
import React, { useState } from 'react';
import { useKeycloak } from '@react-keycloak/web';
import { Button, CircularProgress } from '@mui/material';

const LoginButton = () => {
  const { keycloak } = useKeycloak();
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = () => {
    try {
      console.log('Tentando fazer login com Keycloak');
      setIsLoading(true);
      // Redirect para a página de login do Keycloak com opções explícitas
      keycloak.login({
        redirectUri: window.location.origin,
        // Forçar exibição da tela de login
        prompt: 'login'
      }).catch(error => {
        console.error('Erro ao redirecionar para login:', error);
        setIsLoading(false);
      });
    } catch (error) {
      console.error('Erro no processo de login:', error);
      setIsLoading(false);
    }
  };

  return (
    <Button 
      variant="contained"
      color="primary" 
      onClick={handleLogin}
      disabled={isLoading}
      startIcon={isLoading ? <CircularProgress size={20} color="inherit" /> : null}
    >
      {isLoading ? 'Carregando...' : 'Login com Keycloak'}
    </Button>
  );
};

export default LoginButton;
