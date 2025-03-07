import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
  Tabs,
  Tab,
  Grid,
  TextField,
  Button,
  Avatar,
  IconButton,
  CircularProgress,
  Alert,
  Switch,
  FormControlLabel,
  Divider
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import UploadIcon from '@mui/icons-material/CloudUpload';
import PaymentIcon from '@mui/icons-material/Payment';
import SecurityIcon from '@mui/icons-material/Security';
import PersonIcon from '@mui/icons-material/Person';
import NotificationsIcon from '@mui/icons-material/Notifications';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import { useAuth } from '../contexts/AuthContext';
import PaymentMethodSelector from './PaymentMethodSelector';
import { styled } from '@mui/material/styles';
import { getUserProfile, updateUserProfile } from '../services/user-service';
import { getPaymentMethods, deletePaymentMethod } from '../services/payment-service';

// Componente estilizado para upload de imagem
const VisuallyHiddenInput = styled('input')({
  clip: 'rect(0 0 0 0)',
  clipPath: 'inset(50%)',
  height: 1,
  overflow: 'hidden',
  position: 'absolute',
  bottom: 0,
  left: 0,
  whiteSpace: 'nowrap',
  width: 1,
});

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

const UserSettings = () => {
  const { user, updateUser } = useAuth();
  const [activeTab, setActiveTab] = useState(0);
  const [profileData, setProfileData] = useState({
    name: '',
    email: '',
    bio: '',
    phone: ''
  });
  const [preferences, setPreferences] = useState({
    darkMode: false,
    emailNotifications: true,
    pushNotifications: true
  });
  const [securityData, setSecurityData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [profileLoading, setProfileLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [paymentMethodsLoading, setPaymentMethodsLoading] = useState(true);
  const [paymentMethodsError, setPaymentMethodsError] = useState(null);
  
  // Carrega os dados do perfil
  useEffect(() => {
    loadUserProfile();
    loadPaymentMethods();
  }, []);
  
  const loadUserProfile = async () => {
    setProfileLoading(true);
    try {
      const response = await getUserProfile();
      
      if (response.success) {
        setProfileData({
          name: response.user.name || '',
          email: response.user.email || '',
          bio: response.user.bio || '',
          phone: response.user.phone || ''
        });
        
        setPreferences({
          darkMode: response.user.preferences?.darkMode || false,
          emailNotifications: response.user.preferences?.emailNotifications !== false, // default: true
          pushNotifications: response.user.preferences?.pushNotifications !== false // default: true
        });
        
        if (response.user.avatar_url) {
          setAvatarPreview(response.user.avatar_url);
        }
      } else {
        setError('Não foi possível carregar os dados do perfil');
      }
    } catch (err) {
      setError('Erro ao carregar dados do perfil');
      console.error(err);
    } finally {
      setProfileLoading(false);
    }
  };
  
  const loadPaymentMethods = async () => {
    setPaymentMethodsLoading(true);
    try {
      const response = await getPaymentMethods();
      
      if (response.payment_methods) {
        setPaymentMethods(response.payment_methods);
      } else {
        setPaymentMethodsError('Não foi possível carregar os métodos de pagamento');
      }
    } catch (err) {
      setPaymentMethodsError('Erro ao carregar métodos de pagamento');
      console.error(err);
    } finally {
      setPaymentMethodsLoading(false);
    }
  };
  
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
    
    // Limpa mensagens ao trocar de aba
    setError(null);
    setSuccess(null);
  };
  
  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfileData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handlePreferenceChange = (e) => {
    const { name, checked } = e.target;
    setPreferences(prev => ({
      ...prev,
      [name]: checked
    }));
  };
  
  const handleSecurityChange = (e) => {
    const { name, value } = e.target;
    setSecurityData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };
  
  const handleSaveProfile = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      // Prepara os dados para envio
      const formData = new FormData();
      
      // Adiciona os campos do perfil
      formData.append('name', profileData.name);
      formData.append('bio', profileData.bio);
      formData.append('phone', profileData.phone);
      
      // Adiciona a imagem se houver
      if (avatarFile) {
        formData.append('avatar', avatarFile);
      }
      
      // Adiciona as preferências
      formData.append('preferences', JSON.stringify(preferences));
      
      const response = await updateUserProfile(formData);
      
      if (response.success) {
        setSuccess('Perfil atualizado com sucesso');
        
        // Atualiza o contexto de autenticação se necessário
        if (response.user) {
          updateUser(response.user);
        }
      } else {
        setError(response.error || 'Erro ao atualizar perfil');
      }
    } catch (err) {
      setError('Ocorreu um erro ao atualizar o perfil');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };
  
  const handleChangePassword = async () => {
    // Validação básica
    if (securityData.newPassword !== securityData.confirmPassword) {
      setError('As senhas não coincidem');
      return;
    }
    
    if (!securityData.currentPassword) {
      setError('A senha atual é obrigatória');
      return;
    }
    
    if (securityData.newPassword.length < 6) {
      setError('A nova senha deve ter pelo menos 6 caracteres');
      return;
    }
    
    setLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      const response = await updateUserProfile({
        current_password: securityData.currentPassword,
        new_password: securityData.newPassword
      });
      
      if (response.success) {
        setSuccess('Senha alterada com sucesso');
        setSecurityData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
      } else {
        setError(response.error || 'Erro ao alterar senha');
      }
    } catch (err) {
      setError('Ocorreu um erro ao alterar a senha');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };
  
  const handleRemovePaymentMethod = async (methodId) => {
    try {
      const response = await deletePaymentMethod(methodId);
      
      if (response.success) {
        // Recarrega os métodos de pagamento
        loadPaymentMethods();
        setSuccess('Método de pagamento removido com sucesso');
      } else {
        setError(response.error || 'Erro ao remover método de pagamento');
      }
    } catch (err) {
      setError('Ocorreu um erro ao remover o método de pagamento');
      console.error(err);
    }
  };
  
  if (profileLoading) {
    return (
      <Container maxWidth="lg">
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }
  
  return (
    <Container maxWidth="lg">
      <Typography variant="h4" component="h1" gutterBottom sx={{ mt: 4, mb: 3 }}>
        Configurações da Conta
      </Typography>
      
      <Paper sx={{ mb: 4 }}>
        <Tabs 
          value={activeTab} 
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons="auto"
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab icon={<PersonIcon />} label="Perfil" />
          <Tab icon={<NotificationsIcon />} label="Preferências" />
          <Tab icon={<PaymentIcon />} label="Pagamento" />
          <Tab icon={<SecurityIcon />} label="Segurança" />
        </Tabs>
        
        {/* Aba de Perfil */}
        <TabPanel value={activeTab} index={0}>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}
          
          <Grid container spacing={3}>
            <Grid item xs={12} md={4} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <Avatar 
                src={avatarPreview} 
                alt={profileData.name}
                sx={{ width: 150, height: 150, mb: 2 }}
              />
              
              <Button
                component="label"
                variant="outlined"
                startIcon={<UploadIcon />}
              >
                Alterar Foto
                <VisuallyHiddenInput type="file" accept="image/*" onChange={handleAvatarChange} />
              </Button>
            </Grid>
            
            <Grid item xs={12} md={8}>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    label="Nome Completo"
                    name="name"
                    value={profileData.name}
                    onChange={handleProfileChange}
                    fullWidth
                    variant="outlined"
                  />
                </Grid>
                
                <Grid item xs={12}>
                  <TextField
                    label="E-mail"
                    name="email"
                    value={profileData.email}
                    disabled
                    fullWidth
                    variant="outlined"
                    helperText="O e-mail não pode ser alterado"
                  />
                </Grid>
                
                <Grid item xs={12}>
                  <TextField
                    label="Telefone"
                    name="phone"
                    value={profileData.phone}
                    onChange={handleProfileChange}
                    fullWidth
                    variant="outlined"
                  />
                </Grid>
                
                <Grid item xs={12}>
                  <TextField
                    label="Biografia"
                    name="bio"
                    value={profileData.bio}
                    onChange={handleProfileChange}
                    fullWidth
                    multiline
                    rows={4}
                    variant="outlined"
                  />
                </Grid>
              </Grid>
              
              <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={loading ? <CircularProgress size={24} /> : <SaveIcon />}
                  onClick={handleSaveProfile}
                  disabled={loading}
                >
                  {loading ? 'Salvando...' : 'Salvar Alterações'}
                </Button>
              </Box>
            </Grid>
          </Grid>
        </TabPanel>
        
        {/* Aba de Preferências */}
        <TabPanel value={activeTab} index={1}>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}
          
          <Typography variant="h6" gutterBottom>
            Aparência e Notificações
          </Typography>
          
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={preferences.darkMode}
                    onChange={handlePreferenceChange}
                    name="darkMode"
                  />
                }
                label="Modo Escuro"
              />
            </Grid>
            
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={preferences.emailNotifications}
                    onChange={handlePreferenceChange}
                    name="emailNotifications"
                  />
                }
                label="Receber notificações por e-mail"
              />
            </Grid>
            
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={preferences.pushNotifications}
                    onChange={handlePreferenceChange}
                    name="pushNotifications"
                  />
                }
                label="Receber notificações push"
              />
            </Grid>
          </Grid>
          
          <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
            <Button
              variant="contained"
              color="primary"
              startIcon={loading ? <CircularProgress size={24} /> : <SaveIcon />}
              onClick={handleSaveProfile}
              disabled={loading}
            >
              {loading ? 'Salvando...' : 'Salvar Preferências'}
            </Button>
          </Box>
        </TabPanel>
        
        {/* Aba de Pagamento */}
        <TabPanel value={activeTab} index={2}>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}
          
          <Typography variant="h6" gutterBottom>
            Métodos de Pagamento
          </Typography>
          
          {paymentMethodsLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
              <CircularProgress />
            </Box>
          ) : paymentMethodsError ? (
            <Alert severity="error" sx={{ mb: 2 }}>{paymentMethodsError}</Alert>
          ) : (
            <>
              <Box sx={{ mb: 4 }}>
                <PaymentMethodSelector 
                  onSelect={() => {}} // Apenas para visualização
                  onDelete={handleRemovePaymentMethod}
                  readOnly={true}
                />
              </Box>
              
              <Divider sx={{ my: 3 }} />
              
              <Typography variant="h6" gutterBottom>
                Assinatura Atual
              </Typography>
              
              <Box sx={{ mb: 2 }}>
                <Paper variant="outlined" sx={{ p: 2 }}>
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={8}>
                      <Typography variant="subtitle1">
                        Plano {user?.subscription_level || 'Gratuito'}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Próxima cobrança: {user?.subscription_end_date ? new Date(user.subscription_end_date).toLocaleDateString() : 'N/A'}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} md={4} sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
                      <Button variant="outlined" color="primary" href="/plans">
                        Gerenciar Plano
                      </Button>
                    </Grid>
                  </Grid>
                </Paper>
              </Box>
              
              <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
                Histórico de Pagamentos
              </Typography>
              
              <Button variant="outlined" color="primary" href="/tokens">
                Ver Histórico Completo
              </Button>
            </>
          )}
        </TabPanel>
        
        {/* Aba de Segurança */}
        <TabPanel value={activeTab} index={3}>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}
          
          <Typography variant="h6" gutterBottom>
            Alterar Senha
          </Typography>
          
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                label="Senha Atual"
                name="currentPassword"
                type="password"
                value={securityData.currentPassword}
                onChange={handleSecurityChange}
                fullWidth
                variant="outlined"
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                label="Nova Senha"
                name="newPassword"
                type="password"
                value={securityData.newPassword}
                onChange={handleSecurityChange}
                fullWidth
                variant="outlined"
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                label="Confirmar Senha"
                name="confirmPassword"
                type="password"
                value={securityData.confirmPassword}
                onChange={handleSecurityChange}
                fullWidth
                variant="outlined"
                error={securityData.newPassword !== securityData.confirmPassword && securityData.confirmPassword !== ''}
                helperText={securityData.newPassword !== securityData.confirmPassword && securityData.confirmPassword !== '' ? 'As senhas não coincidem' : ''}
              />
            </Grid>
          </Grid>
          
          <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
            <Button
              variant="contained"
              color="primary"
              startIcon={loading ? <CircularProgress size={24} /> : <SaveIcon />}
              onClick={handleChangePassword}
              disabled={loading}
            >
              {loading ? 'Alterando...' : 'Alterar Senha'}
            </Button>
          </Box>
        </TabPanel>
      </Paper>
    </Container>
  );
};

export default UserSettings; 