// src/App.js
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useKeycloak } from '@react-keycloak/web';
import { Box, Toolbar } from '@mui/material';
import Navbar from './components/Navbar';
import Chat from './components/Chat';
import FichaPaciente from './components/FichaPaciente';
import Dashboard from './components/Dashboard';
import LoginButton from './components/LoginButton';
import PrivateRoute from './components/PrivateRoute';

function App() {
  const { keycloak, initialized } = useKeycloak();

  if (!initialized) {
    return <div>Carregando...</div>;
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column' }}>
      {/* Navbar Fixa na Parte Superior */}
      <Navbar />

      {/* Conteúdo Principal com Padding no Topo */}
      <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
        <Toolbar /> {/* Espaço reservado para a Navbar */}
        <Routes>
          {/* Redirecionamento inicial para o Dashboard */}
          <Route path="/" element={keycloak.authenticated ? <Navigate to="/dashboard" /> : <LoginButton />} />
          
          {/* Rotas protegidas */}
          <Route element={<PrivateRoute />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/chat" element={<Chat />} />
            <Route path="/ficha-paciente" element={<FichaPaciente />} />
          </Route>
          
          {/* Redirecionamento para o Dashboard caso rota não encontrada */}
          <Route path="*" element={<Navigate to="/dashboard" />} />
        </Routes>
      </Box>
    </Box>
  );
}

export default App;
