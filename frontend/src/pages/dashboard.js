import React, { useEffect, useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { 
  Box, 
  Container, 
  Typography, 
  Grid, 
  Paper, 
  Button, 
  AppBar, 
  Toolbar, 
  Avatar, 
  Menu, 
  MenuItem, 
  IconButton,
  Divider,
  CircularProgress,
  Tooltip,
  Badge,
  List,
  ListItem,
  ListItemIcon,
  ListItemText
} from '@mui/material';
import { 
  Dashboard as DashboardIcon, 
  Person as PersonIcon, 
  Book as BookIcon, 
  Chat as ChatIcon,
  ExitToApp as LogoutIcon, 
  Menu as MenuIcon,
  AccountCircle,
  Settings,
  Notifications,
  Add as AddIcon,
  BarChart as BarChartIcon,
  Help as HelpIcon,
  People as PeopleIcon,
  MenuBook as MenuBookIcon,
  Insights as InsightsIcon,
  Assessment as StatsIcon
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import authService from '../api/auth.service';

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null);
  const [notificationsAnchorEl, setNotificationsAnchorEl] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [statsData, setStatsData] = useState({
    patients: 0,
    ebooks: 0,
    conversations: 0,
    lastAccess: 'Hoje'
  });

  // Verificar autenticação
  useEffect(() => {
    const verifyAuth = async () => {
      setLoading(true);
      try {
        // Verificar se o usuário está autenticado
        if (!authService.isLoggedIn()) {
          navigate('/login', { replace: true });
          return;
        }
        
        // Carregar dados do usuário
        const userInfo = authService.getCurrentUser();
        if (userInfo) {
          setUserData(userInfo);
        } else {
          // Se não conseguir recuperar do localStorage, tentar obter do backend
          try {
            const response = await fetch('/api/auth/user', {
              headers: {
                'Authorization': `Bearer ${authService.getToken()}`
              }
            });
            
            if (response.ok) {
              const data = await response.json();
              if (data.status === 'ok' && data.user) {
                setUserData(data.user);
              } else {
                throw new Error('Falha ao obter dados do usuário');
              }
            } else {
              throw new Error('Resposta inválida do servidor');
            }
          } catch (error) {
            console.error('Erro ao buscar dados do usuário:', error);
            navigate('/login', { replace: true });
          }
        }

        // Carregar estatísticas (simularemos com dados mockados)
        // Em uma implementação real, você buscaria isso do backend
        fetchUserStats();
        
      } catch (error) {
        console.error('Erro ao verificar autenticação:', error);
        navigate('/login', { replace: true });
      } finally {
        setLoading(false);
      }
    };
    
    verifyAuth();
  }, [navigate]);

  // Simular busca de estatísticas do usuário
  const fetchUserStats = () => {
    // Em uma implementação real, isso seria uma chamada de API
    // Aqui estamos apenas simulando dados para demonstração
    setTimeout(() => {
      setStatsData({
        patients: Math.floor(Math.random() * 10),
        ebooks: Math.floor(Math.random() * 5),
        conversations: Math.floor(Math.random() * 20),
        lastAccess: 'Hoje'
      });
    }, 500);
  };

  // Manipulador de menu de usuário
  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleNotificationsOpen = (event) => {
    setNotificationsAnchorEl(event.currentTarget);
  };

  const handleNotificationsClose = () => {
    setNotificationsAnchorEl(null);
  };

  const handleMobileMenuToggle = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  // Manipulador de logout
  const handleLogout = async () => {
    handleMenuClose();
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    }
  };

  // Navegação para perfil
  const handleProfileNavigation = () => {
    handleMenuClose();
    navigate('/profile');
  };

  // Navegação para configurações
  const handleSettingsNavigation = () => {
    handleMenuClose();
    navigate('/settings');
  };

  // Obter iniciais do nome do usuário
  const getUserInitials = () => {
    if (!userData || !userData.name) return '?';
    
    return userData.name
      .split(' ')
      .slice(0, 2)
      .map(name => name.charAt(0))
      .join('')
      .toUpperCase();
  };

  // Formatador de data
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }).format(date);
  };

  // Componente para o item de navegação principal, garantindo cliques funcionais
  const NavItem = ({ to, icon, text, onClick }) => (
    <Button
      component={Link}
      to={to}
      color="inherit"
      sx={{ 
        mx: 1, 
        textTransform: 'none',
        '&:hover': { 
          backgroundColor: 'rgba(255, 255, 255, 0.1)' 
        }
      }}
      onClick={onClick}
      startIcon={icon}
    >
      {text}
    </Button>
  );

  // Mostrar loader enquanto verifica autenticação
  if (loading) {
    return (
      <Box 
        display="flex" 
        justifyContent="center" 
        alignItems="center" 
        minHeight="100vh"
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ flexGrow: 1 }}>
      {/* AppBar */}
      <AppBar position="static">
        <Toolbar>
          <IconButton
            size="large"
            edge="start"
            color="inherit"
            aria-label="menu"
            sx={{ mr: 2, display: { sm: 'none' } }}
            onClick={handleMobileMenuToggle}
          >
            <MenuIcon />
          </IconButton>
          
          <Typography 
            variant="h6" 
            component={Link}
            to="/dashboard"
            sx={{ 
              flexGrow: 1,
              fontWeight: 'bold',
              textDecoration: 'none',
              color: 'inherit'
            }}
          >
            AdamChat
          </Typography>
          
          {/* Menu de Navegação Desktop */}
          <Box sx={{ display: { xs: 'none', md: 'flex' } }}>
            <NavItem
              to="/dashboard"
              icon={<DashboardIcon />}
              text="Dashboard"
            />
            <NavItem
              to="/patients"
              icon={<PeopleIcon />}
              text="Pacientes"
            />
            <NavItem
              to="/library"
              icon={<MenuBookIcon />}
              text="Biblioteca"
            />
            <NavItem
              to="/chat"
              icon={<ChatIcon />}
              text="Chat"
            />
            <NavItem
              to="/analytics"
              icon={<InsightsIcon />}
              text="Análises"
            />
          </Box>
          
          {/* User Avatar & Menu */}
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Tooltip title="Notificações">
              <IconButton 
                color="inherit" 
                sx={{ mr: 1 }}
                onClick={handleNotificationsOpen}
              >
                <Badge badgeContent={3} color="error">
                  <Notifications />
                </Badge>
              </IconButton>
            </Tooltip>
            
            <Menu
              anchorEl={notificationsAnchorEl}
              open={Boolean(notificationsAnchorEl)}
              onClose={handleNotificationsClose}
              keepMounted
            >
              <MenuItem onClick={handleNotificationsClose}>
                <Typography variant="body2">Você tem uma nova mensagem</Typography>
              </MenuItem>
              <MenuItem onClick={handleNotificationsClose}>
                <Typography variant="body2">Seu ebook foi gerado com sucesso</Typography>
              </MenuItem>
              <MenuItem onClick={handleNotificationsClose}>
                <Typography variant="body2">Atualização do sistema disponível</Typography>
              </MenuItem>
              <Divider />
              <MenuItem 
                onClick={handleNotificationsClose}
                sx={{
                  justifyContent: 'center',
                  color: 'primary.main',
                  fontWeight: 'bold'
                }}
              >
                Ver todas
              </MenuItem>
            </Menu>
            
            <Tooltip title="Menu do usuário">
              <Avatar 
                onClick={handleMenuOpen}
                sx={{ 
                  bgcolor: 'secondary.main',
                  cursor: 'pointer',
                  '&:hover': {
                    opacity: 0.8
                  }
                }}
              >
                {getUserInitials()}
              </Avatar>
            </Tooltip>
            
            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={handleMenuClose}
              keepMounted
            >
              <MenuItem 
                onClick={handleProfileNavigation}
                sx={{ minWidth: 150 }}
              >
                <AccountCircle sx={{ mr: 1 }} />
                Perfil
              </MenuItem>
              
              <MenuItem onClick={handleSettingsNavigation}>
                <Settings sx={{ mr: 1 }} />
                Configurações
              </MenuItem>
              
              <Divider />
              
              <MenuItem onClick={handleLogout}>
                <LogoutIcon sx={{ mr: 1 }} />
                Sair
              </MenuItem>
            </Menu>
          </Box>
        </Toolbar>
      </AppBar>
      
      {/* Menu Móvel */}
      {mobileMenuOpen && (
        <Box
          sx={{
            position: 'fixed',
            top: 64,
            left: 0,
            width: '100%',
            bgcolor: 'background.paper',
            zIndex: 1000,
            boxShadow: 3
          }}
        >
          <List>
            <ListItem 
              component={Link} 
              to="/dashboard" 
              onClick={() => setMobileMenuOpen(false)}
              button
            >
              <ListItemIcon>
                <DashboardIcon />
              </ListItemIcon>
              <ListItemText primary="Dashboard" />
            </ListItem>
            
            <ListItem 
              component={Link} 
              to="/patients" 
              onClick={() => setMobileMenuOpen(false)}
              button
            >
              <ListItemIcon>
                <PeopleIcon />
              </ListItemIcon>
              <ListItemText primary="Pacientes" />
            </ListItem>
            
            <ListItem 
              component={Link} 
              to="/library" 
              onClick={() => setMobileMenuOpen(false)}
              button
            >
              <ListItemIcon>
                <MenuBookIcon />
              </ListItemIcon>
              <ListItemText primary="Biblioteca" />
            </ListItem>
            
            <ListItem 
              component={Link} 
              to="/chat" 
              onClick={() => setMobileMenuOpen(false)}
              button
            >
              <ListItemIcon>
                <ChatIcon />
              </ListItemIcon>
              <ListItemText primary="Chat" />
            </ListItem>
            
            <ListItem 
              component={Link} 
              to="/analytics" 
              onClick={() => setMobileMenuOpen(false)}
              button
            >
              <ListItemIcon>
                <InsightsIcon />
              </ListItemIcon>
              <ListItemText primary="Análises" />
            </ListItem>
          </List>
        </Box>
      )}
      
      {/* Conteúdo Principal */}
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" component="h1" fontWeight="medium">
            Dashboard
          </Typography>
          
          <Typography variant="body1" color="text.secondary">
            Bem-vindo, {userData?.name || 'Usuário'}! Aqui está um resumo da sua conta.
          </Typography>
        </Box>
        
        <Grid container spacing={3}>
          {/* Card de Boas-vindas */}
          <Grid item xs={12} md={6}>
            <Paper 
              elevation={0}
              sx={{ 
                p: 3, 
                height: '100%',
                borderRadius: 2,
                border: '1px solid rgba(0,0,0,0.08)'
              }}
            >
              <Typography variant="h6" fontWeight="bold" gutterBottom>
                Bem-vindo ao AdamChat
              </Typography>
              
              <Typography variant="body1" paragraph>
                Esta é a sua área personalizada onde você pode gerenciar todas as funcionalidades do sistema.
              </Typography>
              
              <Typography variant="body1">
                Utilize o menu superior para navegar entre as diferentes seções disponíveis na plataforma.
              </Typography>

              <Box sx={{ mt: 2 }}>
                <Button 
                  variant="contained" 
                  color="primary"
                  component={Link}
                  to="/help"
                  startIcon={<HelpIcon />}
                  sx={{ mt: 2 }}
                >
                  Tutorial Rápido
                </Button>
              </Box>
            </Paper>
          </Grid>
          
          {/* Card de Informações do Usuário */}
          <Grid item xs={12} md={6}>
            <Paper 
              elevation={0}
              sx={{ 
                p: 3, 
                height: '100%',
                borderRadius: 2,
                border: '1px solid rgba(0,0,0,0.08)'
              }}
            >
              <Typography variant="h6" fontWeight="bold" gutterBottom>
                Detalhes da Conta
              </Typography>
              
              <Box sx={{ mt: 2 }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Nome:
                </Typography>
                <Typography variant="body1" fontWeight="medium" gutterBottom>
                  {userData?.name || 'Não informado'}
                </Typography>
              </Box>
              
              <Box sx={{ mt: 1 }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  E-mail:
                </Typography>
                <Typography variant="body1" gutterBottom>
                  {userData?.email || 'Não informado'}
                </Typography>
              </Box>
              
              <Box sx={{ mt: 1 }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Plano:
                </Typography>
                <Typography variant="body1" fontWeight="medium" gutterBottom>
                  {userData?.subscription_level || 'Gratuito'}
                </Typography>
              </Box>
              
              <Box sx={{ mt: 1 }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Membro desde:
                </Typography>
                <Typography variant="body1" gutterBottom>
                  {userData?.created_at ? formatDate(userData.created_at) : 'N/A'}
                </Typography>
              </Box>

              <Box sx={{ mt: 2 }}>
                <Button 
                  variant="outlined" 
                  color="primary"
                  component={Link}
                  to="/profile"
                  startIcon={<AccountCircle />}
                >
                  Editar Perfil
                </Button>
              </Box>
            </Paper>
          </Grid>
          
          {/* Card de Atividades */}
          <Grid item xs={12} sm={6} md={4}>
            <Paper 
              elevation={0}
              sx={{ 
                p: 3, 
                height: '100%',
                borderRadius: 2,
                border: '1px solid rgba(0,0,0,0.08)'
              }}
            >
              <Typography variant="h6" fontWeight="bold" gutterBottom>
                Resumo de Atividades
              </Typography>
              
              <Box sx={{ mt: 2 }}>
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">
                      Pacientes:
                    </Typography>
                    <Typography variant="h6">
                      {statsData.patients}
                    </Typography>
                  </Grid>
                  
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">
                      Ebooks:
                    </Typography>
                    <Typography variant="h6">
                      {statsData.ebooks}
                    </Typography>
                  </Grid>
                  
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">
                      Conversas:
                    </Typography>
                    <Typography variant="h6">
                      {statsData.conversations}
                    </Typography>
                  </Grid>
                  
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">
                      Último acesso:
                    </Typography>
                    <Typography variant="body2">
                      {statsData.lastAccess}
                    </Typography>
                  </Grid>
                </Grid>
              </Box>

              <Box sx={{ mt: 2 }}>
                <Button 
                  variant="outlined" 
                  fullWidth
                  component={Link}
                  to="/analytics"
                  startIcon={<StatsIcon />}
                >
                  Ver Estatísticas
                </Button>
              </Box>
            </Paper>
          </Grid>
          
          {/* Card de Recursos */}
          <Grid item xs={12} sm={6} md={4}>
            <Paper 
              elevation={0}
              sx={{ 
                p: 3, 
                height: '100%',
                borderRadius: 2,
                border: '1px solid rgba(0,0,0,0.08)'
              }}
            >
              <Typography variant="h6" fontWeight="bold" gutterBottom>
                Recursos Disponíveis
              </Typography>
              
              <Box sx={{ mt: 2 }}>
                <Typography 
                  variant="body2" 
                  sx={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    mb: 1,
                    cursor: 'pointer',
                    '&:hover': { color: 'primary.main' }
                  }}
                  component={Link}
                  to="/chat"
                  style={{ textDecoration: 'none', color: 'inherit' }}
                >
                  <span>Chat com IA:</span>
                  <span style={{ color: '#4caf50', fontWeight: 'bold' }}>Disponível</span>
                </Typography>
                
                <Typography 
                  variant="body2" 
                  sx={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    mb: 1,
                    cursor: 'pointer',
                    '&:hover': { color: 'primary.main' }
                  }}
                  component={Link}
                  to="/library"
                  style={{ textDecoration: 'none', color: 'inherit' }}
                >
                  <span>Geração de Ebooks:</span>
                  <span style={{ color: '#4caf50', fontWeight: 'bold' }}>Disponível</span>
                </Typography>
                
                <Typography variant="body2" sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <span>Agendamento:</span>
                  <span style={{ color: '#ff9800', fontWeight: 'bold' }}>Em breve</span>
                </Typography>
                
                <Typography variant="body2" sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <span>Prescrições:</span>
                  <span style={{ color: '#ff9800', fontWeight: 'bold' }}>Em breve</span>
                </Typography>
              </Box>

              <Box sx={{ mt: 2 }}>
                <Button 
                  variant="outlined" 
                  fullWidth
                  component={Link}
                  to="/pricing"
                >
                  Ver Planos Premium
                </Button>
              </Box>
            </Paper>
          </Grid>
          
          {/* Card de Ações Rápidas */}
          <Grid item xs={12} sm={6} md={4}>
            <Paper 
              elevation={0}
              sx={{ 
                p: 3, 
                height: '100%',
                borderRadius: 2,
                border: '1px solid rgba(0,0,0,0.08)'
              }}
            >
              <Typography variant="h6" fontWeight="bold" gutterBottom>
                Ações Rápidas
              </Typography>
              
              <Box sx={{ mt: 2 }}>
                <Button 
                  variant="outlined" 
                  fullWidth 
                  sx={{ mb: 1.5 }}
                  startIcon={<ChatIcon />}
                  component={Link}
                  to="/chat/new"
                >
                  Iniciar Chat
                </Button>
                
                <Button 
                  variant="outlined" 
                  fullWidth 
                  sx={{ mb: 1.5 }}
                  startIcon={<BookIcon />}
                  component={Link}
                  to="/library/create"
                >
                  Criar Ebook
                </Button>
                
                <Button 
                  variant="outlined" 
                  fullWidth 
                  sx={{ mb: 1.5 }}
                  startIcon={<AddIcon />}
                  component={Link}
                  to="/patients/add"
                >
                  Adicionar Paciente
                </Button>
              </Box>
            </Paper>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
};

export default Dashboard; 