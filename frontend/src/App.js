// src/App.js
import React, { useEffect } from 'react';
import { AppBar, Toolbar, Typography, Button, Box } from '@mui/material';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { useKeycloak } from '@react-keycloak/web';
import LoginButton from './components/LoginButton';
import PrivateRoute from './components/PrivateRoute';
import ChatPage from './components/ChatPage';

function App() {
  const { keycloak, initialized } = useKeycloak();
  const navigate = useNavigate();

  useEffect(() => {
    if (initialized && keycloak.authenticated) {
      navigate('/chat');
    }
  }, [initialized, keycloak.authenticated, navigate]);

  const handleLogout = () => {
    keycloak.logout({ redirectUri: 'http://localhost:3002/' });
  };

  if (!initialized) {
    return <div>Carregando...</div>;
  }

  return (
    <Box>
      <AppBar position="static" sx={{ backgroundColor: "#1976d2" }}>
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            AdamChat
          </Typography>
          {/* Exibe o nome do usuário se autenticado */}
          {keycloak.authenticated && keycloak.tokenParsed && (
            <Typography variant="body1" sx={{ marginRight: 2 }}>
              {keycloak.tokenParsed.name || keycloak.tokenParsed.preferred_username}
            </Typography>
          )}
          {keycloak.authenticated ? (
            <Button color="inherit" onClick={handleLogout}>
              Deslogar
            </Button>
          ) : (
            <LoginButton />
          )}
        </Toolbar>
      </AppBar>
      <Routes>
        <Route path="/chat" element={<ChatPage />} />
        <Route path="*" element={<Navigate to="/chat" />} />
      </Routes>
    </Box>
  );
}

export default App;
