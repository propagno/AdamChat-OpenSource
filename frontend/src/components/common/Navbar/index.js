// src/components/common/Navbar/index.js
import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import {
  Box,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Avatar,
  Divider,
  useMediaQuery,
  useTheme,
  Typography
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  Chat as ChatIcon,
  Description as FichaIcon,
  Logout as LogoutIcon,
  Book as BookIcon,
  LibraryBooks as LibraryBooksIcon
} from '@mui/icons-material';
import './styles.css';

const Navbar = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  // isMobile is kept for future use
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  const [mobileOpen, setMobileOpen] = useState(false);
  
  const menuItems = [
    { text: 'Dashboard', icon: <DashboardIcon />, path: '/dashboard' },
    { text: 'Chat Integrado', icon: <ChatIcon />, path: '/chat' },
    { text: 'Ficha do Paciente', icon: <FichaIcon />, path: '/ficha-paciente' },
    { text: 'Gerar eBook', icon: <BookIcon />, path: '/ebook-generator' },
    { text: 'Biblioteca', icon: <LibraryBooksIcon />, path: '/ebook-library' }
  ];

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleUserMenuClose = () => {
    // Kept for simplicity, but removed the unused state manipulation
  };

  const handleLogout = () => {
    handleUserMenuClose();
    logout();
    navigate('/');
  };

  // Extrair informações do usuário, se disponíveis
  const username = isAuthenticated ? 
    (user?.username || 'Usuário') : 
    'Visitante';

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-logo">
          AdamChat
        </Link>
        
        <div className="menu-icon" onClick={handleDrawerToggle}>
          <i className={mobileOpen ? 'fas fa-times' : 'fas fa-bars'}></i>
        </div>
        
        <ul className={mobileOpen ? 'nav-menu active' : 'nav-menu'}>
          {isAuthenticated ? (
            // Links para usuários autenticados
            <>
              <li className="nav-item">
                <Link 
                  to="/dashboard" 
                  className="nav-link" 
                  onClick={() => setMobileOpen(false)}
                >
                  Dashboard
                </Link>
              </li>
              <li className="nav-item">
                <Link 
                  to="/chat" 
                  className="nav-link" 
                  onClick={() => setMobileOpen(false)}
                >
                  Chat
                </Link>
              </li>
              <li className="nav-item">
                <Link 
                  to="/ficha-paciente" 
                  className="nav-link" 
                  onClick={() => setMobileOpen(false)}
                >
                  Fichas
                </Link>
              </li>
              <li className="nav-item">
                <Link 
                  to="/ebook-generator" 
                  className="nav-link" 
                  onClick={() => setMobileOpen(false)}
                >
                  E-books
                </Link>
              </li>
              <li className="nav-item">
                <div className="user-info">
                  <span className="username">{username}</span>
                  <button 
                    className="logout-button" 
                    onClick={handleLogout}
                  >
                    Sair
                  </button>
                </div>
              </li>
            </>
          ) : (
            // Links para visitantes
            <li className="nav-item">
              <button 
                className="login-nav-button" 
                onClick={() => navigate('/')}
              >
                Entrar
              </button>
            </li>
          )}
        </ul>
      </div>
    </nav>
  );
};

export default Navbar;
