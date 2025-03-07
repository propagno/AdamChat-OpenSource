import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import {
  Box,
  Button,
  Container,
  TextField,
  Typography,
  Paper,
  Alert,
  CircularProgress,
  InputAdornment,
  IconButton,
  Divider
} from '@mui/material';
import { Visibility, VisibilityOff, VpnKey } from '@mui/icons-material';
import authService from '../api/auth.service';

/**
 * Componente para redefinir senha com token de recuperação
 */
const ResetPassword = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Extrair token da URL (query param)
  const queryParams = new URLSearchParams(location.search);
  const token = queryParams.get('token');
  
  // Estados do formulário
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [formErrors, setFormErrors] = useState({
    password: '',
    confirmPassword: ''
  });
  
  // Verificar se o token está presente
  useEffect(() => {
    if (!token) {
      setError('Token de redefinição de senha inválido ou ausente. Solicite um novo link de redefinição de senha.');
    }
  }, [token]);
  
  // Alternar visibilidade da senha
  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };
  
  // Validar campos do formulário
  const validateForm = () => {
    let isValid = true;
    const errors = {
      password: '',
      confirmPassword: ''
    };
    
    // Validar senha
    if (!password) {
      errors.password = 'Nova senha é obrigatória';
      isValid = false;
    } else if (password.length < 8) {
      errors.password = 'A senha deve ter pelo menos 8 caracteres';
      isValid = false;
    }
    
    // Validar confirmação de senha
    if (password !== confirmPassword) {
      errors.confirmPassword = 'As senhas não coincidem';
      isValid = false;
    }
    
    setFormErrors(errors);
    return isValid;
  };
  
  // Manipulador de submissão do formulário
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    setError('');
    setSuccess('');
    
    if (!token) {
      setError('Token de redefinição de senha não encontrado. Solicite um novo link de redefinição de senha.');
      return;
    }
    
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);
    
    try {
      const response = await authService.resetPassword(token, password);
      
      setSuccess(response.message || 'Senha redefinida com sucesso! Você já pode fazer login com sua nova senha.');
      
      // Redirecionar para o login após 3 segundos
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (err) {
      console.error('Erro ao redefinir senha:', err);
      setError(err.message || 'Ocorreu um erro ao redefinir sua senha. O link pode ter expirado ou ser inválido.');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <Container component="main" maxWidth="sm" sx={{ mt: 8, mb: 4 }}>
      <Paper 
        elevation={3} 
        sx={{ 
          p: 4, 
          display: 'flex', 
          flexDirection: 'column', 
          borderRadius: 2
        }}
      >
        <Box sx={{ mb: 3, textAlign: 'center' }}>
          <Typography component="h1" variant="h4" fontWeight="bold" color="primary">
            AdamChat
          </Typography>
          <Typography variant="h5" sx={{ mt: 1 }}>
            Definir Nova Senha
          </Typography>
        </Box>
        
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
        
        {!token ? (
          <Box sx={{ textAlign: 'center', mt: 2 }}>
            <Typography variant="body1" gutterBottom>
              Token de redefinição de senha inválido ou ausente.
            </Typography>
            <Button 
              component={Link} 
              to="/forgot-password" 
              variant="contained" 
              sx={{ mt: 2 }}
            >
              Solicitar nova redefinição
            </Button>
          </Box>
        ) : (
          <Box component="form" onSubmit={handleSubmit} noValidate>
            <TextField
              margin="normal"
              required
              fullWidth
              name="password"
              label="Nova senha"
              type={showPassword ? 'text' : 'password'}
              id="password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              error={!!formErrors.password}
              helperText={formErrors.password}
              disabled={loading}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <VpnKey color="action" />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label="toggle password visibility"
                      onClick={togglePasswordVisibility}
                      edge="end"
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
            
            <TextField
              margin="normal"
              required
              fullWidth
              name="confirmPassword"
              label="Confirmar nova senha"
              type={showPassword ? 'text' : 'password'}
              id="confirmPassword"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              error={!!formErrors.confirmPassword}
              helperText={formErrors.confirmPassword}
              disabled={loading}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <VpnKey color="action" />
                  </InputAdornment>
                ),
              }}
            />
            
            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 3, mb: 2, py: 1.2 }}
              disabled={loading}
            >
              {loading ? <CircularProgress size={24} /> : 'Redefinir senha'}
            </Button>
            
            <Divider sx={{ my: 2 }} />
            
            <Box sx={{ mt: 2, textAlign: 'center' }}>
              <Typography variant="body2">
                <Link to="/login" style={{ textDecoration: 'none' }}>
                  <Typography component="span" variant="body2" color="primary">
                    Voltar para o login
                  </Typography>
                </Link>
              </Typography>
            </Box>
          </Box>
        )}
      </Paper>
    </Container>
  );
};

export default ResetPassword; 