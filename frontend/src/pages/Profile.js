import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Box, 
  Container, 
  Typography, 
  Paper, 
  TextField, 
  Button, 
  Grid,
  Avatar,
  Divider,
  Alert,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle
} from '@mui/material';
import { PersonOutline, SaveOutlined, DeleteOutline } from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';

/**
 * Página de perfil do usuário
 * Permite visualizar e editar informações do perfil
 */
const Profile = () => {
  const navigate = useNavigate();
  const { user, isLoading, updateProfile, deleteAccount, logout } = useAuth();
  
  // Estados do componente
  const [userData, setUserData] = useState({
    name: '',
    email: '',
    username: '',
    language: 'pt-BR',
    theme: 'light'
  });
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  
  // Carregar dados do usuário quando o componente montar
  useEffect(() => {
    if (user) {
      setUserData({
        name: user.name || '',
        email: user.email || '',
        username: user.username || '',
        language: user.language || 'pt-BR',
        theme: user.theme || 'light'
      });
    }
  }, [user]);
  
  // Função para atualizar o estado com os valores dos campos
  const handleChange = (e) => {
    const { name, value } = e.target;
    setUserData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Função para salvar alterações do perfil
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSaving(true);
    
    try {
      const result = await updateProfile(userData);
      
      if (result.success) {
        setSuccess('Perfil atualizado com sucesso!');
      } else {
        setError(result.error || 'Erro ao atualizar perfil');
      }
    } catch (err) {
      setError('Erro ao comunicar com o servidor');
      console.error('Erro ao atualizar perfil:', err);
    } finally {
      setSaving(false);
    }
  };
  
  // Função para excluir conta
  const handleDeleteAccount = async () => {
    setDeleteLoading(true);
    setError('');
    
    try {
      const result = await deleteAccount();
      
      if (result.success) {
        setOpenDeleteDialog(false);
        navigate('/login');
      } else {
        setError(result.error || 'Erro ao excluir conta');
        setOpenDeleteDialog(false);
      }
    } catch (err) {
      setError('Erro ao comunicar com o servidor');
      setOpenDeleteDialog(false);
      console.error('Erro ao excluir conta:', err);
    } finally {
      setDeleteLoading(false);
    }
  };
  
  // Se estiver carregando os dados iniciais
  if (isLoading) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="70vh">
          <CircularProgress />
        </Box>
      </Container>
    );
  }
  
  // Se não houver usuário logado
  if (!user) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h5" gutterBottom>
            Acesso não autorizado
          </Typography>
          <Typography paragraph>
            Você precisa estar logado para acessar esta página.
          </Typography>
          <Button 
            variant="contained" 
            color="primary"
            onClick={() => navigate('/login')}
          >
            Ir para Login
          </Button>
        </Paper>
      </Container>
    );
  }
  
  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Paper elevation={3} sx={{ p: 3 }}>
        <Box display="flex" alignItems="center" mb={3}>
          <Avatar 
            sx={{ width: 80, height: 80, mr: 2, bgcolor: 'primary.main' }}
          >
            {userData.name.charAt(0) || <PersonOutline />}
          </Avatar>
          <Box>
            <Typography variant="h4" gutterBottom>
              Meu Perfil
            </Typography>
            <Typography variant="body1" color="textSecondary">
              Gerencie suas informações pessoais
            </Typography>
          </Box>
        </Box>
        
        <Divider sx={{ mb: 3 }} />
        
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}
        
        {success && (
          <Alert severity="success" sx={{ mb: 3 }}>
            {success}
          </Alert>
        )}
        
        <form onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Nome"
                name="name"
                value={userData.name}
                onChange={handleChange}
                variant="outlined"
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Nome de usuário"
                name="username"
                value={userData.username}
                onChange={handleChange}
                variant="outlined"
                disabled  // Username geralmente não é alterável
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Email"
                name="email"
                type="email"
                value={userData.email}
                onChange={handleChange}
                variant="outlined"
                disabled  // Email geralmente requer verificação para alteração
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Idioma"
                name="language"
                select
                value={userData.language}
                onChange={handleChange}
                variant="outlined"
                SelectProps={{
                  native: true,
                }}
              >
                <option value="pt-BR">Português (Brasil)</option>
                <option value="en-US">English (US)</option>
                <option value="es">Español</option>
              </TextField>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Tema"
                name="theme"
                select
                value={userData.theme}
                onChange={handleChange}
                variant="outlined"
                SelectProps={{
                  native: true,
                }}
              >
                <option value="light">Claro</option>
                <option value="dark">Escuro</option>
              </TextField>
            </Grid>
            
            <Grid item xs={12}>
              <Box display="flex" justifyContent="space-between">
                <Button
                  variant="outlined"
                  color="error"
                  startIcon={<DeleteOutline />}
                  onClick={() => setOpenDeleteDialog(true)}
                >
                  Excluir Conta
                </Button>
                
                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  startIcon={<SaveOutlined />}
                  disabled={saving}
                >
                  {saving ? 'Salvando...' : 'Salvar Alterações'}
                </Button>
              </Box>
            </Grid>
          </Grid>
        </form>
      </Paper>
      
      {/* Dialog de confirmação para excluir conta */}
      <Dialog
        open={openDeleteDialog}
        onClose={() => setOpenDeleteDialog(false)}
      >
        <DialogTitle>Excluir sua conta?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Esta ação não pode ser desfeita. Todos os seus dados serão permanentemente removidos.
            Você tem certeza que deseja excluir sua conta?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setOpenDeleteDialog(false)} 
            disabled={deleteLoading}
          >
            Cancelar
          </Button>
          <Button 
            onClick={handleDeleteAccount} 
            color="error" 
            disabled={deleteLoading}
          >
            {deleteLoading ? 'Excluindo...' : 'Excluir Permanentemente'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Profile; 