// src/App.js
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Chat from './components/Chat';
import { useKeycloak } from '@react-keycloak/web';
import LoginButton from './components/LoginButton';
import { AppBar, Toolbar, Typography, Button, Box } from '@mui/material';
import PrivateRoute from './components/PrivateRoute';

function App() {
  const { keycloak, initialized } = useKeycloak();

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
          {keycloak.authenticated && keycloak.tokenParsed && (
            <>
              <Typography variant="body1" sx={{ mr: 2 }}>
                {keycloak.tokenParsed.name || keycloak.tokenParsed.preferred_username}
              </Typography>
              <Button color="inherit" onClick={handleLogout}>Deslogar</Button>
            </>
          )}
        </Toolbar>
      </AppBar>
      <Routes>
        <Route path="/" element={keycloak.authenticated ? <Navigate to="/chat" /> : <LoginButton />} />
        <Route element={<PrivateRoute />}>
          <Route path="/chat" element={<Chat />} />
        </Route>
        <Route path="*" element={<Navigate to="/chat" />} />
      </Routes>
    </Box>
  );
}

export default App;
