// src/components/Navbar.js
import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useColorMode } from '../contexts/ColorModeContext';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  IconButton,
  Box,
  Menu,
  MenuItem,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Avatar,
  Badge,
  Divider,
  useMediaQuery,
  useTheme,
  Tooltip,
  Chip,
  Collapse
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  Chat as ChatIcon,
  Description as FichaIcon,
  Logout as LogoutIcon,
  Menu as MenuIcon,
  Notifications as NotificationIcon,
  Settings as SettingsIcon,
  Help as HelpIcon,
  Person as PersonIcon,
  Book as BookIcon,
  LibraryBooks as LibraryBooksIcon,
  ChevronLeftIcon,
  ExpandLess,
  ExpandMore,
  Psychology as PsychologyIcon
} from '@mui/icons-material';
import './Navbar.css';

const Navbar = ({ variant = 'default' }) => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isAtChatPage = location.pathname.includes('/chat');
  
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuAnchor, setUserMenuAnchor] = useState(null);
  const [notificationAnchor, setNotificationAnchor] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [profileMenuAnchor, setProfileMenuAnchor] = useState(null);
  const [innerAiOpen, setInnerAiOpen] = useState(false);
  
  const menuItems = [
    { text: 'Dashboard', icon: <DashboardIcon />, path: '/dashboard' },
    { text: 'Chat Integrado', icon: <ChatIcon />, path: '/chat' },
    { text: 'Ficha do Paciente', icon: <FichaIcon />, path: '/ficha-paciente' },
    { text: 'Gerar eBook', icon: <BookIcon />, path: '/ebook-generator' },
    { text: 'Biblioteca', icon: <LibraryBooksIcon />, path: '/ebook-library' }
  ];

  // Notificações simuladas
  const notifications = [
    { id: 1, text: 'Nova mensagem do paciente', time: '10 min atrás' },
    { id: 2, text: 'Lembrete de consulta', time: '1 hora atrás' },
    { id: 3, text: 'Atualização do sistema', time: '3 horas atrás' }
  ];

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
    setDrawerOpen(!drawerOpen);
  };

  const handleUserMenuOpen = (event) => {
    setUserMenuAnchor(event.currentTarget);
  };

  const handleUserMenuClose = () => {
    setUserMenuAnchor(null);
  };

  const handleNotificationOpen = (event) => {
    setNotificationAnchor(event.currentTarget);
  };

  const handleNotificationClose = () => {
    setNotificationAnchor(null);
  };

  const handleLogout = () => {
    handleUserMenuClose();
    logout();
    navigate('/');
  };

  const handleNavigation = (path) => {
    navigate(path);
    if (isMobile) {
      setDrawerOpen(false);
    }
  };

  const toggleInnerAiMenu = () => {
    setInnerAiOpen(!innerAiOpen);
  };

  // Extrair informações do usuário, se disponíveis
  const username = isAuthenticated ? 
    (user.tokenParsed?.preferred_username || 'Usuário') : 
    'Visitante';
  const userInitial = username.charAt(0).toUpperCase();

  // Lista de itens do menu
  const menuItemsList = [
    { 
      id: 'home', 
      label: 'Dashboard', 
      path: '/', 
      icon: <DashboardIcon /> 
    },
    { 
      id: 'chat', 
      label: 'Chat IA', 
      path: '/chat', 
      icon: <ChatIcon /> 
    },
    { 
      id: 'image', 
      label: 'Gerador de Imagens', 
      path: '/image-generator', 
      icon: <img src="/image-icon.png" alt="Gerador de Imagens" style={{ width: 24, height: 24 }} /> 
    },
    { 
      id: 'ebook', 
      label: 'Gerador de E-books', 
      path: '/ebook-generator', 
      icon: <BookIcon /> 
    },
    { 
      id: 'library', 
      label: 'Biblioteca de E-books', 
      path: '/ebook-library', 
      icon: <FichaIcon /> 
    },
    { 
      id: 'patient', 
      label: 'Fichas de Pacientes', 
      path: '/ficha-paciente', 
      icon: <FichaIcon /> 
    }
  ];
  
  // Lista de itens do Inner AI
  const innerAiItems = [
    { 
      id: 'video', 
      label: 'Gerador de Vídeos', 
      path: '/video-generator', 
      icon: <img src="/video-icon.png" alt="Gerador de Vídeos" style={{ width: 24, height: 24 }} /> 
    },
    { 
      id: 'avatar', 
      label: 'Criador de Avatares', 
      path: '/avatar-creator', 
      icon: <PersonIcon /> 
    },
    { 
      id: 'fashion', 
      label: 'Fotos Fashion', 
      path: '/fashion-photo', 
      icon: <img src="/fashion-icon.png" alt="Fotos Fashion" style={{ width: 24, height: 24 }} /> 
    },
    { 
      id: 'plans', 
      label: 'Planos e Assinaturas', 
      path: '/plans', 
      icon: <img src="/plans-icon.png" alt="Planos e Assinaturas" style={{ width: 24, height: 24 }} /> 
    },
    { 
      id: 'tokens', 
      label: 'Comprar Tokens', 
      path: '/tokens', 
      icon: <img src="/tokens-icon.png" alt="Comprar Tokens" style={{ width: 24, height: 24 }} /> 
    }
  ];

  // Componente de Drawer (menu lateral)
  const drawerContent = (
    <Box sx={{ width: 250 }}>
      <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <Avatar 
          sx={{ width: 60, height: 60, mb: 1, bgcolor: 'primary.main' }}
        >
          {userInitial}
        </Avatar>
        <Typography variant="subtitle1" align="center">
          {username}
        </Typography>
      </Box>
      <Divider />
      <List>
        {menuItemsList.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <ListItem 
              button 
              key={item.id} 
              component={Link} 
              to={item.path}
              onClick={() => handleNavigation(item.path)}
              sx={{
                bgcolor: isActive ? 'rgba(25, 118, 210, 0.1)' : 'transparent',
                '&:hover': {
                  bgcolor: isActive ? 'rgba(25, 118, 210, 0.2)' : 'rgba(0, 0, 0, 0.04)'
                }
              }}
            >
              <ListItemIcon sx={{ color: isActive ? 'primary.main' : 'inherit' }}>
                {item.icon}
              </ListItemIcon>
              <ListItemText primary={item.label} sx={{ color: isActive ? 'primary.main' : 'inherit' }} />
            </ListItem>
          );
        })}
      </List>
      <Divider />
      <List>
        <ListItem button onClick={handleLogout}>
          <ListItemIcon>
            <LogoutIcon />
          </ListItemIcon>
          <ListItemText primary="Sair" />
        </ListItem>
      </List>
    </Box>
  );

  // Determinar se deve mostrar a versão simplificada do NavBar para a página de chat
  const useSimpleNavbar = variant === 'simple' || isAtChatPage;

  // Conteúdo do NavBar simplificado para a página de chat
  if (useSimpleNavbar) {
    return (
      <AppBar 
        position="static" 
        color="transparent" 
        elevation={0}
        sx={{ 
          borderBottom: 1, 
          borderColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.08)',
          bgcolor: theme.palette.mode === 'dark' ? '#16162c' : '#ffffff' 
        }}
      >
        <Toolbar sx={{ justifyContent: 'space-between', minHeight: { xs: 56, sm: 64 } }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <PsychologyIcon 
              sx={{ 
                color: theme.palette.primary.main, 
                fontSize: 28, 
                mr: 1 
              }} 
            />
            <Typography 
              variant="h6" 
              component={Link} 
              to="/dashboard" 
              sx={{ 
                color: 'text.primary',
                textDecoration: 'none',
                fontWeight: 700,
                fontSize: { xs: '1rem', sm: '1.25rem' },
                letterSpacing: '-0.5px'
              }}
            >
              AdamAI
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            {isAuthenticated && (
              <>
                <Tooltip title="Dashboard">
                  <IconButton 
                    color="inherit" 
                    component={Link} 
                    to="/dashboard"
                    sx={{ ml: { xs: 1, sm: 2 } }}
                  >
                    <DashboardIcon />
                  </IconButton>
                </Tooltip>
                
                <Tooltip title="Configurações">
                  <IconButton 
                    color="inherit" 
                    component={Link} 
                    to="/settings"
                    sx={{ ml: { xs: 1, sm: 2 } }}
                  >
                    <SettingsIcon />
                  </IconButton>
                </Tooltip>
                
                <Avatar
                  src={user?.photoURL}
                  alt={user?.name || 'Usuário'}
                  sx={{ 
                    width: 36, 
                    height: 36,
                    ml: { xs: 1, sm: 2 },
                    cursor: 'pointer',
                    bgcolor: 'primary.main'
                  }}
                  onClick={handleUserMenuOpen}
                >
                  {user?.name?.charAt(0) || 'U'}
                </Avatar>
                <Menu
                  anchorEl={userMenuAnchor}
                  open={Boolean(userMenuAnchor)}
                  onClose={handleUserMenuClose}
                  onClick={handleUserMenuClose}
                  PaperProps={{
                    elevation: 3,
                    sx: { 
                      mt: 1.5,
                      minWidth: 180,
                      borderRadius: 2,
                      overflow: 'visible',
                      boxShadow: theme.palette.mode === 'dark' 
                        ? '0 4px 20px rgba(0,0,0,0.5)' 
                        : '0 4px 20px rgba(0,0,0,0.1)',
                      '&:before': {
                        content: '""',
                        display: 'block',
                        position: 'absolute',
                        top: 0,
                        right: 14,
                        width: 10,
                        height: 10,
                        bgcolor: 'background.paper',
                        transform: 'translateY(-50%) rotate(45deg)',
                        zIndex: 0,
                      },
                    },
                  }}
                  transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                  anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
                >
                  <MenuItem component={Link} to="/profile">
                    <ListItemIcon>
                      <PersonIcon fontSize="small" />
                    </ListItemIcon>
                    Perfil
                  </MenuItem>
                  <MenuItem component={Link} to="/settings">
                    <ListItemIcon>
                      <SettingsIcon fontSize="small" />
                    </ListItemIcon>
                    Configurações
                  </MenuItem>
                  <Divider sx={{ my: 1 }} />
                  <MenuItem onClick={handleLogout}>
                    <ListItemIcon>
                      <LogoutIcon fontSize="small" />
                    </ListItemIcon>
                    Sair
                  </MenuItem>
                </Menu>
              </>
            )}
          </Box>
        </Toolbar>
      </AppBar>
    );
  }

  // Retorno do NavBar padrão (existente)
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
                onClick={() => logout()}
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
