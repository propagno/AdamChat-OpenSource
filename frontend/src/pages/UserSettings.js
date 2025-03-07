import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  Container,
  Typography,
  Paper,
  Box,
  Button,
  TextField,
  Grid,
  Switch,
  FormControlLabel,
  Divider,
  Avatar,
  Tab,
  Tabs,
  Alert,
  IconButton,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemText,
  Badge
} from '@mui/material';
import {
  Save as SaveIcon,
  Person as PersonIcon,
  Security as SecurityIcon,
  Notifications as NotificationsIcon,
  ArrowBack as ArrowBackIcon,
  Settings as SettingsIcon,
  Delete as DeleteIcon,
  PhotoCamera as PhotoCameraIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';

// Variantes de animação
const pageVariants = {
  initial: {
    opacity: 0,
    y: 20
  },
  in: {
    opacity: 1,
    y: 0
  },
  out: {
    opacity: 0,
    y: -20
  }
};

const pageTransition = {
  type: 'tween',
  ease: 'anticipate',
  duration: 0.5
};

// Componente de abas
function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`settings-tabpanel-${index}`}
      aria-labelledby={`settings-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

function a11yProps(index) {
  return {
    id: `settings-tab-${index}`,
    'aria-controls': `settings-tabpanel-${index}`,
  };
}

const UserSettings = () => {
  const { user } = useAuth();
  const [tabValue, setTabValue] = useState(0);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    bio: '',
    phone: '',
    oldPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState({
    oldPassword: false,
    newPassword: false,
    confirmPassword: false
  });
  const [notifications, setNotifications] = useState({
    email: true,
    push: true,
    sms: false,
    newPatient: true,
    updates: true,
    marketing: false
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Carregar dados do usuário
    if (user) {
      setFormData({
        ...formData,
        name: user.name || '',
        email: user.email || ''
      });
    }
  }, [user]);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleTogglePasswordVisibility = (field) => {
    setShowPassword({
      ...showPassword,
      [field]: !showPassword[field]
    });
  };

  const handleNotificationChange = (e) => {
    const { name, checked } = e.target;
    setNotifications({
      ...notifications,
      [name]: checked
    });
  };

  const handleProfileSubmit = (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    // Simular envio de dados
    setTimeout(() => {
      setLoading(false);
      setSuccess('Perfil atualizado com sucesso!');
      
      // Limpar a mensagem de sucesso após 3 segundos
      setTimeout(() => {
        setSuccess(null);
      }, 3000);
    }, 1000);
  };

  const handlePasswordSubmit = (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    // Validar senhas
    if (formData.newPassword !== formData.confirmPassword) {
      setError('As senhas não coincidem.');
      setLoading(false);
      return;
    }
    
    // Simular envio de dados
    setTimeout(() => {
      setLoading(false);
      setSuccess('Senha atualizada com sucesso!');
      
      // Limpar a mensagem de sucesso e os campos de senha
      setTimeout(() => {
        setSuccess(null);
      }, 3000);
      
      setFormData({
        ...formData,
        oldPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    }, 1000);
  };

  const handleNotificationsSubmit = (e) => {
    e.preventDefault();
    setLoading(true);
    
    // Simular envio de dados
    setTimeout(() => {
      setLoading(false);
      setSuccess('Preferências de notificação atualizadas com sucesso!');
      
      // Limpar a mensagem de sucesso após 3 segundos
      setTimeout(() => {
        setSuccess(null);
      }, 3000);
    }, 1000);
  };

  return (
    <motion.div
      initial="initial"
      animate="in"
      exit="out"
      variants={pageVariants}
      transition={pageTransition}
    >
      <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <IconButton 
            component={Link} 
            to="/dashboard"
            sx={{ mr: 2 }}
            aria-label="voltar para o dashboard"
          >
            <ArrowBackIcon />
          </IconButton>
          
          <Typography variant="h4" component="h1">
            Configurações de Usuário
          </Typography>
        </Box>

        {success && (
          <Alert severity="success" sx={{ mb: 3 }}>
            {success}
          </Alert>
        )}
        
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <Paper elevation={2} sx={{ p: 3, textAlign: 'center' }}>
              <Badge
                overlap="circular"
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                badgeContent={
                  <IconButton 
                    size="small" 
                    sx={{ 
                      backgroundColor: 'primary.main',
                      color: 'white',
                      '&:hover': {
                        backgroundColor: 'primary.dark',
                      },
                      width: 32,
                      height: 32
                    }}
                  >
                    <PhotoCameraIcon fontSize="small" />
                  </IconButton>
                }
              >
                <Avatar 
                  sx={{ 
                    width: 120, 
                    height: 120,
                    margin: '0 auto 16px',
                    bgcolor: 'primary.main',
                    fontSize: '2.5rem'
                  }}
                >
                  {user?.name?.charAt(0) || 'U'}
                </Avatar>
              </Badge>
              
              <Typography variant="h6" gutterBottom>
                {user?.name || 'Usuário'}
              </Typography>
              
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                {user?.email || 'email@exemplo.com'}
              </Typography>
              
              <Divider sx={{ my: 2 }} />
              
              <List>
                <ListItem button selected={tabValue === 0} onClick={() => setTabValue(0)}>
                  <ListItemText primary="Perfil" />
                </ListItem>
                <ListItem button selected={tabValue === 1} onClick={() => setTabValue(1)}>
                  <ListItemText primary="Segurança" />
                </ListItem>
                <ListItem button selected={tabValue === 2} onClick={() => setTabValue(2)}>
                  <ListItemText primary="Notificações" />
                </ListItem>
              </List>
              
              <Button
                variant="outlined"
                color="error"
                startIcon={<DeleteIcon />}
                fullWidth
                sx={{ mt: 2 }}
              >
                Excluir Conta
              </Button>
            </Paper>
          </Grid>
          
          <Grid item xs={12} md={8}>
            <Card>
              <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                <Tabs
                  value={tabValue}
                  onChange={handleTabChange}
                  aria-label="configurações de usuário"
                  sx={{ px: 2, pt: 2 }}
                >
                  <Tab icon={<PersonIcon />} label="Perfil" {...a11yProps(0)} />
                  <Tab icon={<SecurityIcon />} label="Segurança" {...a11yProps(1)} />
                  <Tab icon={<NotificationsIcon />} label="Notificações" {...a11yProps(2)} />
                </Tabs>
              </Box>
              
              <TabPanel value={tabValue} index={0}>
                <form onSubmit={handleProfileSubmit}>
                  <Grid container spacing={2}>
                    <Grid item xs={12}>
                      <Typography variant="h6" gutterBottom>
                        Informações Pessoais
                      </Typography>
                    </Grid>
                    
                    <Grid item xs={12} sm={6}>
                      <TextField
                        label="Nome"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        fullWidth
                        required
                      />
                    </Grid>
                    
                    <Grid item xs={12} sm={6}>
                      <TextField
                        label="Email"
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        fullWidth
                        required
                      />
                    </Grid>
                    
                    <Grid item xs={12} sm={6}>
                      <TextField
                        label="Telefone"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        fullWidth
                      />
                    </Grid>
                    
                    <Grid item xs={12}>
                      <TextField
                        label="Biografia"
                        name="bio"
                        value={formData.bio}
                        onChange={handleInputChange}
                        multiline
                        rows={4}
                        fullWidth
                      />
                    </Grid>
                    
                    <Grid item xs={12}>
                      <Button
                        type="submit"
                        variant="contained"
                        color="primary"
                        startIcon={<SaveIcon />}
                        disabled={loading}
                      >
                        Salvar Alterações
                      </Button>
                    </Grid>
                  </Grid>
                </form>
              </TabPanel>
              
              <TabPanel value={tabValue} index={1}>
                <form onSubmit={handlePasswordSubmit}>
                  <Grid container spacing={2}>
                    <Grid item xs={12}>
                      <Typography variant="h6" gutterBottom>
                        Alterar Senha
                      </Typography>
                    </Grid>
                    
                    <Grid item xs={12}>
                      <TextField
                        label="Senha Atual"
                        name="oldPassword"
                        type={showPassword.oldPassword ? 'text' : 'password'}
                        value={formData.oldPassword}
                        onChange={handleInputChange}
                        fullWidth
                        required
                        InputProps={{
                          endAdornment: (
                            <IconButton
                              onClick={() => handleTogglePasswordVisibility('oldPassword')}
                              edge="end"
                            >
                              {showPassword.oldPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                            </IconButton>
                          )
                        }}
                      />
                    </Grid>
                    
                    <Grid item xs={12}>
                      <TextField
                        label="Nova Senha"
                        name="newPassword"
                        type={showPassword.newPassword ? 'text' : 'password'}
                        value={formData.newPassword}
                        onChange={handleInputChange}
                        fullWidth
                        required
                        InputProps={{
                          endAdornment: (
                            <IconButton
                              onClick={() => handleTogglePasswordVisibility('newPassword')}
                              edge="end"
                            >
                              {showPassword.newPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                            </IconButton>
                          )
                        }}
                      />
                    </Grid>
                    
                    <Grid item xs={12}>
                      <TextField
                        label="Confirmar Nova Senha"
                        name="confirmPassword"
                        type={showPassword.confirmPassword ? 'text' : 'password'}
                        value={formData.confirmPassword}
                        onChange={handleInputChange}
                        fullWidth
                        required
                        InputProps={{
                          endAdornment: (
                            <IconButton
                              onClick={() => handleTogglePasswordVisibility('confirmPassword')}
                              edge="end"
                            >
                              {showPassword.confirmPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                            </IconButton>
                          )
                        }}
                      />
                    </Grid>
                    
                    <Grid item xs={12}>
                      <Button
                        type="submit"
                        variant="contained"
                        color="primary"
                        startIcon={<SaveIcon />}
                        disabled={loading}
                      >
                        Atualizar Senha
                      </Button>
                    </Grid>
                  </Grid>
                </form>
              </TabPanel>
              
              <TabPanel value={tabValue} index={2}>
                <form onSubmit={handleNotificationsSubmit}>
                  <Grid container spacing={2}>
                    <Grid item xs={12}>
                      <Typography variant="h6" gutterBottom>
                        Preferências de Notificação
                      </Typography>
                    </Grid>
                    
                    <Grid item xs={12}>
                      <Typography variant="subtitle2" gutterBottom>
                        Canais de Notificação
                      </Typography>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={notifications.email}
                            onChange={handleNotificationChange}
                            name="email"
                            color="primary"
                          />
                        }
                        label="Email"
                      />
                      <FormControlLabel
                        control={
                          <Switch
                            checked={notifications.push}
                            onChange={handleNotificationChange}
                            name="push"
                            color="primary"
                          />
                        }
                        label="Notificações Push"
                      />
                      <FormControlLabel
                        control={
                          <Switch
                            checked={notifications.sms}
                            onChange={handleNotificationChange}
                            name="sms"
                            color="primary"
                          />
                        }
                        label="SMS"
                      />
                    </Grid>
                    
                    <Grid item xs={12}>
                      <Divider sx={{ my: 2 }} />
                      <Typography variant="subtitle2" gutterBottom>
                        Tipos de Notificação
                      </Typography>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={notifications.newPatient}
                            onChange={handleNotificationChange}
                            name="newPatient"
                            color="primary"
                          />
                        }
                        label="Novos pacientes"
                      />
                      <FormControlLabel
                        control={
                          <Switch
                            checked={notifications.updates}
                            onChange={handleNotificationChange}
                            name="updates"
                            color="primary"
                          />
                        }
                        label="Atualizações do sistema"
                      />
                      <FormControlLabel
                        control={
                          <Switch
                            checked={notifications.marketing}
                            onChange={handleNotificationChange}
                            name="marketing"
                            color="primary"
                          />
                        }
                        label="Ofertas e promoções"
                      />
                    </Grid>
                    
                    <Grid item xs={12}>
                      <Button
                        type="submit"
                        variant="contained"
                        color="primary"
                        startIcon={<SaveIcon />}
                        disabled={loading}
                      >
                        Salvar Preferências
                      </Button>
                    </Grid>
                  </Grid>
                </form>
              </TabPanel>
            </Card>
          </Grid>
        </Grid>
      </Container>
    </motion.div>
  );
};

export default UserSettings; 