import React, { useState, useEffect } from 'react';
import { useNavigate, Link, Link as RouterLink, useLocation } from 'react-router-dom';
import { 
  Box, 
  Button, 
  Container, 
  TextField, 
  Typography, 
  Paper, 
  Grid,
  InputAdornment,
  IconButton,
  Alert,
  Divider,
  CircularProgress,
  Link as MuiLink,
  FormControlLabel,
  Checkbox,
  useTheme,
  Avatar,
  Card,
  CardContent,
  Stack
} from '@mui/material';
import { 
  Visibility, 
  VisibilityOff, 
  Email, 
  Lock, 
  Refresh, 
  BugReport,
  SmartToy,
  Psychology 
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import authService from '../api/auth.service';
import LoginErrorHelp from '../components/common/LoginErrorHelp';
import SocialLogin from '../components/SocialLogin';
import loginDebug from '../utils/debugLogin';

/**
 * Componente de Login
 * 
 * Fornece interface para autenticação do usuário, com:
 * - Campos para email e senha
 * - Opção para mostrar/ocultar senha
 * - Link para recuperação de senha
 * - Opção para criar nova conta
 * - Tratamento de erros visíveis ao usuário
 * - Redirecionamento automático para o dashboard após login
 */
const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isAuthenticated, checkAuth } = useAuth();
  const theme = useTheme();
  
  // Estados para gerenciar o formulário
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [errorType, setErrorType] = useState('');
  const [success, setSuccess] = useState('');
  const [formErrors, setFormErrors] = useState({});
  const [backendHealthy, setBackendHealthy] = useState(null);
  const [rememberMe, setRememberMe] = useState(false);
  
  // Verificar se o usuário já está autenticado
  useEffect(() => {
    const checkAuthStatus = async () => {
      const isUserAuthenticated = await checkAuth();
      if (isUserAuthenticated) {
        navigate('/dashboard');
      }
    };
    
    checkAuthStatus();
  }, [checkAuth, navigate]);
  
  // Verificar conectividade com o backend ao carregar o componente
  useEffect(() => {
    const checkBackendHealth = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/health');
        if (response.ok) {
          console.log('✅ Backend está acessível');
          setBackendHealthy(true);
        } else {
          console.error(`❌ Backend retornou status ${response.status}`);
          setBackendHealthy(false);
          setError('O servidor não está respondendo corretamente. Contate o suporte.');
          setErrorType('network');
        }
      } catch (error) {
        console.error('❌ Erro ao verificar saúde do backend:', error);
        setBackendHealthy(false);
        setError('Não foi possível conectar ao servidor. Verifique sua conexão ou tente novamente mais tarde.');
        setErrorType('network');
      }
    };
    
    checkBackendHealth();
  }, []);
  
  // Verificar se há mensagem de erro na navegação
  useEffect(() => {
    // Verificar se há erro no state da navegação (redirecionamento do OAuthCallback)
    if (location.state && location.state.error) {
      setError(location.state.error);
      setErrorType('oauth');
      
      // Limpar o state para não mostrar o erro novamente em recargas
      window.history.replaceState({}, document.title);
    }
    
    // Verificar se há erro na URL (redirecionamento direto do backend)
    const urlParams = new URLSearchParams(window.location.search);
    const urlError = urlParams.get('error');
    const errorDescription = urlParams.get('error_description');
    
    if (urlError) {
      setError(errorDescription || `Erro na autenticação: ${urlError}`);
      setErrorType('oauth');
      
      // Limpar parâmetros da URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [location]);
  
  // Validar campos do formulário
  const validateForm = () => {
    let isValid = true;
    const errors = {
      email: '',
      password: ''
    };
    
    // Validar email
    if (!email.trim()) {
      errors.email = 'E-mail é obrigatório';
      isValid = false;
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      errors.email = 'Digite um e-mail válido';
      isValid = false;
    }
    
    // Validar senha
    if (!password) {
      errors.password = 'Senha é obrigatória';
      isValid = false;
    }
    
    setFormErrors(errors);
    return isValid;
  };
  
  // Alternar visibilidade da senha
  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };
  
  // Lidar com submissão do formulário
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Ativar debug temporariamente se não estiver ativado
    const debugWasEnabled = loginDebug.isLoginDebugEnabled();
    if (!debugWasEnabled) {
      loginDebug.enableLoginDebug();
    }
    
    // Registrar início do processo
    loginDebug.logLoginStep('login_start', { email });
    
    // Limpar mensagens
    setError('');
    setErrorType('');
    setSuccess('');
    
    // Validar formulário
    if (!validateForm()) {
      loginDebug.logLoginStep('validation_failed', { errors: formErrors });
      return;
    }
    
    setLoading(true);
    loginDebug.logLoginStep('loading_started');
    
    try {
      console.log('Iniciando tentativa de login com:', email);
      loginDebug.logLoginStep('calling_auth_service', { email });
      
      // Chamar diretamente o serviço de autenticação
      const userData = await authService.login(email, password);
      loginDebug.logLoginStep('login_response_received', { success: true });
      console.log('Login bem-sucedido, dados recebidos:', userData);
      
      // Verificar se o login foi bem-sucedido
      const isLoggedIn = authService.isLoggedIn();
      loginDebug.logLoginStep('token_check', { isLoggedIn });
      
      if (!isLoggedIn) {
        console.error('Login aparentemente bem-sucedido, mas token não foi armazenado');
        loginDebug.logLoginStep('token_missing');
        throw new Error('Falha ao completar o processo de login. Tente novamente.');
      }
      
      // Se chegou aqui, sucesso no login
      setSuccess('Login realizado com sucesso! Redirecionando...');
      loginDebug.logLoginStep('success_message_set');
      
      // Forçar o redirecionamento para o dashboard
      console.log('Redirecionando para o dashboard...');
      loginDebug.logLoginStep('redirecting', { target: '/dashboard' });
      
      // Forçar a página a recarregar para garantir o redirecionamento
      setTimeout(() => {
        // Navegar para o dashboard
        loginDebug.logLoginStep('navigation_started');
        navigate('/dashboard', { replace: true });
        
        // Se o redirecionamento não ocorrer após um curto período, forçar o redirecionamento via window.location
        setTimeout(() => {
          if (window.location.pathname !== '/dashboard') {
            console.log('Forçando redirecionamento via window.location');
            loginDebug.logLoginStep('forced_redirect');
            window.location.href = '/dashboard';
          }
        }, 300);
      }, 1000);
    } catch (err) {
      console.error('Erro ao realizar login:', err);
      loginDebug.logLoginStep('login_error', { message: err.message });
      
      // Mensagens de erro específicas baseadas no tipo de erro
      if (err.response) {
        const status = err.response.status;
        loginDebug.logLoginStep('error_with_response', { status });
        
        if (status === 401 || status === 403) {
          setError('Credenciais inválidas. Verifique seu email e senha.');
          setErrorType('credentials');
        } else if (status === 404) {
          setError('Usuário não encontrado. Verifique seu email ou crie uma nova conta.');
          setErrorType('credentials');
        } else if (status === 429) {
          setError('Muitas tentativas de login. Aguarde alguns minutos e tente novamente.');
          setErrorType('general');
        } else {
          setError(`Erro do servidor (${status}): ${err.response.data?.message || 'Tente novamente mais tarde.'}`);
          setErrorType('general');
        }
      } else if (err.message && err.message.includes('Credenciais inválidas')) {
        // Capturar mensagens de erro específicas enviadas pelo serviço de autenticação
        setError('Credenciais inválidas. Verifique seu email e senha.');
        setErrorType('credentials');
      } else if (err.message && err.message.includes('Usuário não encontrado')) {
        setError('Usuário não encontrado. Verifique seu email ou crie uma nova conta.');
        setErrorType('credentials');
      } else if (err.message && err.message.includes('Network Error')) {
        setError('Erro de conexão. Verifique sua internet e tente novamente.');
        setErrorType('network');
      } else {
        // Mostrar mensagem de erro genérica como último recurso
        setError(err.message || 'Ocorreu um erro ao tentar fazer login. Verifique suas credenciais ou tente novamente mais tarde.');
        setErrorType('general');
      }
      
      // Limpar tokens parciais para evitar problemas de autenticação parcial
      authService.clearAuthState();
      loginDebug.logLoginStep('auth_state_cleared');
    } finally {
      setLoading(false);
      loginDebug.logLoginStep('loading_ended');
      
      // Desativar debug se não estava ativado antes
      if (!debugWasEnabled) {
        // Esperar um pouco para garantir que os logs foram salvos
        setTimeout(() => {
          loginDebug.disableLoginDebug();
        }, 1000);
      }
    }
  };
  
  // Função para limpar o estado de autenticação
  const handleClearAuthState = () => {
    authService.clearAuthState();
    setSuccess('Estado de autenticação limpo. Você pode tentar fazer login novamente.');
  };
  
  return (
    <Box
      sx={{
        height: '100vh',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        background: theme.palette.mode === 'dark' 
          ? 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)' 
          : 'linear-gradient(135deg, #f5f7fa 0%, #e4e8f0 100%)',
        position: 'relative',
        overflow: 'hidden',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundImage: 'radial-gradient(circle at 15% 50%, rgba(69, 104, 220, 0.1) 0%, transparent 33%), radial-gradient(circle at 85% 30%, rgba(69, 104, 220, 0.05) 0%, transparent 33%)',
          zIndex: 1
        },
      }}
    >
      <Container component="main" maxWidth="sm" sx={{ zIndex: 2, px: { xs: 2, sm: 3 } }}>
        <Card 
          elevation={8} 
          sx={{ 
            borderRadius: 3,
            overflow: 'hidden',
            boxShadow: theme.palette.mode === 'dark' 
              ? '0 8px 32px rgba(0, 0, 0, 0.5)' 
              : '0 8px 32px rgba(69, 104, 220, 0.1)',
            backgroundImage: theme.palette.mode === 'dark' 
              ? 'linear-gradient(to bottom right, rgba(47, 53, 67, 0.7), rgba(27, 33, 47, 0.9))' 
              : 'linear-gradient(to bottom right, rgba(255, 255, 255, 0.9), rgba(240, 242, 245, 0.9))',
            backdropFilter: 'blur(20px)',
            transition: 'all 0.3s ease-in-out',
          }}
        >
          <CardContent sx={{ p: 0 }}>
            <Grid container>
              {/* Left side - Logo and branding */}
              <Grid item xs={12} md={5} 
                sx={{ 
                  background: theme.palette.mode === 'dark' 
                    ? 'linear-gradient(135deg, #304FFE 0%, #2979FF 100%)' 
                    : 'linear-gradient(135deg, #304FFE 0%, #2979FF 100%)',
                  color: 'white',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  alignItems: 'center',
                  py: 6,
                  px: 3,
                  textAlign: 'center',
                  position: 'relative',
                  overflow: 'hidden',
                  '&::after': {
                    content: '""',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundImage: 'radial-gradient(circle at 70% 80%, rgba(255, 255, 255, 0.1) 0%, transparent 60%)',
                    zIndex: 1
                  },
                }}
              >
                <Box sx={{ position: 'relative', zIndex: 2 }}>
                  <Box 
                    sx={{ 
                      display: 'flex', 
                      justifyContent: 'center', 
                      mb: 2 
                    }}
                  >
                    <Avatar
                      sx={{
                        bgcolor: 'white',
                        width: 80,
                        height: 80,
                        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
                        mb: 2
                      }}
                    >
                      <Psychology sx={{ fontSize: 50, color: theme.palette.primary.main }} />
                    </Avatar>
                  </Box>
                  <Typography
                    variant="h3"
                    component="h1"
                    sx={{
                      fontWeight: 700,
                      letterSpacing: '0.5px',
                      mb: 2,
                      fontSize: { xs: '2rem', sm: '2.5rem' }
                    }}
                  >
                    AdamAI
                  </Typography>
                  <Typography variant="body1" sx={{ opacity: 0.9, fontWeight: 300, mb: 3 }}>
                    Sua plataforma inteligente
                  </Typography>
                </Box>
              </Grid>
              
              {/* Right side - Login form */}
              <Grid item xs={12} md={7}>
                <Box sx={{ p: { xs: 3, sm: 4, md: 5 } }}>
                  <Typography variant="h5" fontWeight={600} gutterBottom>
                    Bem-vindo(a) de volta
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
                    Entre com suas credenciais para acessar sua conta
                  </Typography>
                  
                  {error && (
                    <Alert 
                      severity="error" 
                      sx={{ 
                        width: '100%', 
                        mb: 3, 
                        borderRadius: 2,
                        boxShadow: '0 2px 8px rgba(0,0,0,0.05)' 
                      }}
                    >
                      {error}
                    </Alert>
                  )}
                  
                  {success && (
                    <Alert 
                      severity="success" 
                      sx={{ 
                        width: '100%', 
                        mb: 3, 
                        borderRadius: 2,
                        boxShadow: '0 2px 8px rgba(0,0,0,0.05)' 
                      }}
                    >
                      {success}
                    </Alert>
                  )}
                  
                  <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1 }}>
                    <TextField
                      margin="normal"
                      required
                      fullWidth
                      id="email"
                      label="Email"
                      name="email"
                      autoComplete="email"
                      autoFocus
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      error={formErrors.email !== ''}
                      helperText={formErrors.email}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <Email color="action" />
                          </InputAdornment>
                        ),
                      }}
                      sx={{
                        mb: 2,
                        '& .MuiOutlinedInput-root': {
                          borderRadius: 2,
                          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                            borderColor: theme.palette.primary.main,
                            borderWidth: 2
                          }
                        }
                      }}
                    />
                    <TextField
                      margin="normal"
                      required
                      fullWidth
                      name="password"
                      label="Senha"
                      type={showPassword ? "text" : "password"}
                      id="password"
                      autoComplete="current-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      error={formErrors.password !== ''}
                      helperText={formErrors.password}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <Lock color="action" />
                          </InputAdornment>
                        ),
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton
                              aria-label="toggle password visibility"
                              onClick={togglePasswordVisibility}
                              edge="end"
                              size="large"
                            >
                              {showPassword ? <VisibilityOff /> : <Visibility />}
                            </IconButton>
                          </InputAdornment>
                        ),
                      }}
                      sx={{
                        mb: 1,
                        '& .MuiOutlinedInput-root': {
                          borderRadius: 2,
                          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                            borderColor: theme.palette.primary.main,
                            borderWidth: 2
                          }
                        }
                      }}
                    />
                    
                    <Grid container sx={{ mb: 3, mt: 1 }}>
                      <Grid item xs>
                        <FormControlLabel
                          control={
                            <Checkbox 
                              value="remember" 
                              color="primary" 
                              checked={rememberMe}
                              onChange={(e) => setRememberMe(e.target.checked)}
                              size="small"
                            />
                          }
                          label={<Typography variant="body2">Lembrar-me</Typography>}
                        />
                      </Grid>
                      <Grid item>
                        <Link 
                          component={RouterLink} 
                          to="/forgot-password" 
                          variant="body2" 
                          sx={{ 
                            color: theme.palette.primary.main,
                            fontWeight: 500,
                            '&:hover': {
                              textDecoration: 'underline'
                            }
                          }}
                        >
                          Esqueceu a senha?
                        </Link>
                      </Grid>
                    </Grid>
                    
                    <Button
                      type="submit"
                      fullWidth
                      variant="contained"
                      disabled={loading}
                      sx={{ 
                        mb: 3, 
                        py: 1.5,
                        borderRadius: 2,
                        boxShadow: '0 4px 12px rgba(69, 104, 220, 0.2)',
                        fontSize: '1rem',
                        fontWeight: 500,
                        letterSpacing: '0.5px',
                        textTransform: 'none',
                        '&:hover': {
                          boxShadow: '0 6px 16px rgba(69, 104, 220, 0.3)',
                        }
                      }}
                    >
                      {loading ? (
                        <CircularProgress size={24} color="inherit" />
                      ) : (
                        "Entrar"
                      )}
                    </Button>

                    
                    {/* Componente de login social */}
                    <SocialLogin />
                    
                    <Box sx={{ mt: 3, textAlign: 'center' }}>
                      <Typography variant="body2" color="text.secondary">
                        Não tem uma conta?{' '}
                        <Link 
                          component={RouterLink} 
                          to="/register" 
                          variant="body2"
                          sx={{ 
                            color: theme.palette.primary.main,
                            fontWeight: 600,
                            '&:hover': {
                              textDecoration: 'underline'
                            }
                          }}
                        >
                          Cadastre-se agora
                        </Link>
                      </Typography>
                    </Box>
                  </Box>
                  
                  {/* Mostrar componente de ajuda se houver erro */}
                  {error && <LoginErrorHelp errorType={errorType} />}
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
        
        <Box sx={{ mt: 3, textAlign: 'center' }}>
          <Typography variant="body2" color={theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.7)' : 'text.secondary'}>
            &copy; {new Date().getFullYear()} AdamAI - Todos os direitos reservados
          </Typography>
        </Box>
      </Container>
    </Box>
  );
};

export default Login; 