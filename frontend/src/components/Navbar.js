// src/components/Navbar.js
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useKeycloak } from '@react-keycloak/web';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  IconButton,
  Box
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  Chat as ChatIcon,
  Description as FichaIcon,
  Logout as LogoutIcon
} from '@mui/icons-material';

const Navbar = () => {
  const { keycloak } = useKeycloak();
  const navigate = useNavigate();

  const menuItems = [
    { text: 'Dashboard', icon: <DashboardIcon />, path: '/dashboard' },
    { text: 'Chat Integrado', icon: <ChatIcon />, path: '/chat' },
    { text: 'Ficha do Paciente', icon: <FichaIcon />, path: '/ficha-paciente' }
  ];

  const handleLogout = () => {
    keycloak.logout({ redirectUri: 'http://localhost:3002/' });
  };

  return (
    <AppBar position="fixed" sx={{ backgroundColor: "#1976d2" }}>
      <Toolbar>
        <Typography variant="h6" sx={{ flexGrow: 1, cursor: 'pointer' }} onClick={() => navigate('/dashboard')}>
          AdamChat
        </Typography>

        <Box sx={{ display: 'flex', gap: 2 }}>
          {menuItems.map((item, index) => (
            <Button
              key={index}
              color="inherit"
              startIcon={item.icon}
              component={Link}
              to={item.path}
            >
              {item.text}
            </Button>
          ))}
        </Box>

        {keycloak.authenticated && keycloak.tokenParsed && (
          <Box sx={{ display: 'flex', alignItems: 'center', ml: 2 }}>
            <Typography variant="body2" sx={{ mr: 2 }}>
              {keycloak.tokenParsed.name || keycloak.tokenParsed.preferred_username}
            </Typography>
            <IconButton color="inherit" onClick={handleLogout}>
              <LogoutIcon />
            </IconButton>
          </Box>
        )}
      </Toolbar>
    </AppBar>
  );
};

export default Navbar;
