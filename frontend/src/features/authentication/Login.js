import React, { useState, useEffect } from 'react';
import { Link as RouterLink, useNavigate, useLocation } from 'react-router-dom';
import {
  TextField,
  Button,
  FormControlLabel,
  Checkbox,
  Link,
  Box,
  Typography,
  InputAdornment,
  IconButton,
  Divider,
  Alert,
  Paper,
} from '@mui/material';
import { Visibility, VisibilityOff, LockOutlined, EmailOutlined } from '@mui/icons-material';
import { useAuth } from '../../hooks/useAuth';
import { STORAGE_KEYS } from '../../config/app.config';

/**
 * Página de login
 * Gerencia autenticação e redirecionamento após login bem-sucedido
 */
const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isAuthenticated, isLoading, error } = useAuth();
  
  // Estado para campos do formulário
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  // Estado para validação e erros
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [formError, setFormError] = useState('');

  // Redirecionar para a página solicitada ou dashboard se já estiver autenticado
  useEffect(() => {
    if (isAuthenticated) {
      const { from } = location.state || { from: '/app/dashboard' };
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, location]);
  
  // Carregar email salvo se 'lembrar-me' tiver sido usado antes
  useEffect(() => {
    const savedEmail = localStorage.getItem(STORAGE_KEYS.REMEMBERED_EMAIL);
    if (savedEmail) {
      setEmail(savedEmail);
      setRememberMe(true);
    }
  }, []);
  
  // Validação de email
  const validateEmail = (email) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) {
      setEmailError('Email é obrigatório');
      return false;
    } else if (!regex.test(email)) {
      setEmailError('Email inválido');
      return false;
    } else {
      setEmailError('');
      return true;
    }
  };
  
  // Validação de senha
  const validatePassword = (password) => {
    if (!password) {
      setPasswordError('Senha é obrigatória');
      return false;
    } else if (password.length < 6) {
      setPasswordError('Senha deve ter pelo menos 6 caracteres');
      return false;
    } else {
      setPasswordError('');
      return true;
    }
  };
  
  // Manipulador para o formulário de login
  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    
    // Validar todos os campos
    const isEmailValid = validateEmail(email);
    const isPasswordValid = validatePassword(password);
    
    if (!isEmailValid || !isPasswordValid) {
      return;
    }
    
    try {
      // Salvar email se 'lembrar-me' estiver marcado
      if (rememberMe) {
        localStorage.setItem(STORAGE_KEYS.REMEMBERED_EMAIL, email);
      } else {
        localStorage.removeItem(STORAGE_KEYS.REMEMBERED_EMAIL);
      }
      
      // Realizar login
      const result = await login(email, password);
      
      if (!result.success) {
        setFormError(result.error || 'Credenciais inválidas. Verifique seu email e senha.');
      }
    } catch (err) {
      console.error('Erro ao fazer login:', err);
      setFormError('Ocorreu um erro durante o login. Tente novamente mais tarde.');
    }
  };
  
  // Alternar visibilidade da senha
  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };
  
  return (
    <Paper
      component="form"
      onSubmit={handleSubmit}
      sx={{
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Logo da aplicação */}
      <Box display="flex" justifyContent="center" mb={2}>
        <img 
          src="/logo.svg" 
          alt="AdamChat Logo" 
          width="80" 
          height="80"
          style={{ margin: '0 auto' }}
        />
      </Box>
      
      <Box mb={3} textAlign="center">
        <Typography variant="h5" component="h1" gutterBottom>
          Entrar no AdamChat
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Acesse sua conta para continuar
        </Typography>
      </Box>
  
      {/* Exibir mensagens de erro */}
      {(formError || error) && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {formError || error.message || 'Erro de autenticação'}
        </Alert>
      )}
      
      {/* Campo de email */}
      <TextField
        fullWidth
        label="Email"
        variant="outlined"
        margin="normal"
        autoComplete="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        onBlur={() => validateEmail(email)}
        error={!!emailError}
        helperText={emailError}
        disabled={isLoading}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <EmailOutlined />
            </InputAdornment>
          ),
        }}
      />
      
      {/* Campo de senha */}
      <TextField
        fullWidth
        label="Senha"
        variant="outlined"
        margin="normal"
        type={showPassword ? 'text' : 'password'}
        autoComplete="current-password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        onBlur={() => validatePassword(password)}
        error={!!passwordError}
        helperText={passwordError}
        disabled={isLoading}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <LockOutlined />
            </InputAdornment>
          ),
          endAdornment: (
            <InputAdornment position="end">
              <IconButton
                aria-label="alternar visibilidade da senha"
                onClick={togglePasswordVisibility}
                edge="end"
              >
                {showPassword ? <VisibilityOff /> : <Visibility />}
              </IconButton>
            </InputAdornment>
          ),
        }}
      />
      
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mb={2}
        mt={1}
        flexWrap="wrap"
      >
        {/* Opção de lembrar-me */}
        <FormControlLabel
          control={
            <Checkbox
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              color="primary"
              disabled={isLoading}
            />
          }
          label="Lembrar-me"
        />
        
        {/* Link para recuperação de senha */}
        <Link
          component={RouterLink}
          to="/reset-password"
          variant="body2"
          underline="hover"
          sx={{ ml: 'auto' }}
        >
          Esqueceu a senha?
        </Link>
      </Box>
      
      {/* Botão de login */}
      <Button
        type="submit"
        fullWidth
        variant="contained"
        color="primary"
        size="large"
        disabled={isLoading}
        sx={{ mt: 2, mb: 2, py: 1.5 }}
      >
        {isLoading ? 'Entrando...' : 'Entrar'}
      </Button>
      
      <Divider sx={{ my: 2 }}>
        <Typography variant="body2" color="text.secondary">
          ou
        </Typography>
      </Divider>
      
      {/* Link para registro */}
      <Box textAlign="center" mt={2}>
        <Typography variant="body2">
          Não tem uma conta?{' '}
          <Link component={RouterLink} to="/register" variant="body2" underline="hover">
            Criar conta
          </Link>
        </Typography>
      </Box>
      
      {/* Link para diagnóstico */}
      <Box textAlign="center" mt={3}>
        <Link
          component={RouterLink}
          to="/system-status"
          variant="caption"
          color="text.secondary"
          underline="hover"
        >
          Verificar status do sistema
        </Link>
      </Box>
    </Paper>
  );
};

export default Login; 