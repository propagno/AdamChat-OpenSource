import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Container,
  TextField,
  Typography,
  Paper,
  Stepper,
  Step,
  StepLabel,
  IconButton,
  InputAdornment,
  Grid,
  Alert,
  CircularProgress
} from '@mui/material';
import { Visibility, VisibilityOff, ArrowBack } from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';

/**
 * Componente de Registro
 * 
 * Formulário de registro multi-etapas com:
 * - Validação de campo
 * - Verificação de senha forte
 * - Feedback visual para o usuário
 * - Confirmação de sucesso
 */
const Register = () => {
  const navigate = useNavigate();
  const { register } = useAuth();
  
  // Estados do formulário
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [userData, setUserData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: ''
  });
  
  // Etapas do formulário
  const steps = ['Informações básicas', 'Dados pessoais'];
  
  // Gerenciar mudanças nos campos do formulário
  const handleChange = (e) => {
    const { name, value } = e.target;
    setUserData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Alternar visibilidade da senha
  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };
  
  // Validar primeira etapa (informações básicas)
  const validateStep1 = () => {
    setError('');
    
    // Validar nome de usuário
    if (!userData.username.trim()) {
      setError('Nome de usuário é obrigatório');
      return false;
    }
    
    // Validar email
    if (!userData.email.trim()) {
      setError('E-mail é obrigatório');
      return false;
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(userData.email)) {
      setError('E-mail inválido');
      return false;
    }
    
    // Validar senha
    if (!userData.password) {
      setError('Senha é obrigatória');
      return false;
    }
    
    if (userData.password.length < 8) {
      setError('A senha deve ter pelo menos 8 caracteres');
      return false;
    }
    
    // Validar confirmação de senha
    if (userData.password !== userData.confirmPassword) {
      setError('As senhas não coincidem');
      return false;
    }
    
    return true;
  };
  
  // Validar segunda etapa (dados pessoais)
  const validateStep2 = () => {
    setError('');
    
    // Validar nome
    if (!userData.firstName.trim()) {
      setError('Nome é obrigatório');
      return false;
    }
    
    // Validar sobrenome
    if (!userData.lastName.trim()) {
      setError('Sobrenome é obrigatório');
      return false;
    }
    
    return true;
  };
  
  // Avançar para a próxima etapa
  const handleNext = () => {
    if (activeStep === 0) {
      if (validateStep1()) {
        setActiveStep(1);
      }
    } else if (activeStep === 1) {
      if (validateStep2()) {
        handleSubmit();
      }
    }
  };
  
  // Voltar para a etapa anterior
  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1);
  };
  
  // Enviar formulário de registro
  const handleSubmit = async () => {
    setLoading(true);
    setError('');
    
    try {
      // Formatar dados para o backend
      const registrationData = {
        username: userData.username,
        email: userData.email,
        password: userData.password,
        first_name: userData.firstName,
        last_name: userData.lastName
      };
      
      // Chamar função de registro do contexto de autenticação
      const result = await register(registrationData);
      
      if (result.success) {
        setSuccess('Conta criada com sucesso! Você será redirecionado para a página de login em instantes.');
        // Limpar formulário
        setUserData({
          username: '',
          email: '',
          password: '',
          confirmPassword: '',
          firstName: '',
          lastName: ''
        });
        
        // Redirecionar para a página de login após 2 segundos
        setTimeout(() => {
          navigate('/login');
        }, 2000);
      } else {
        setError(result.message || 'Erro ao criar conta. Tente novamente.');
      }
    } catch (err) {
      console.error('Erro ao registrar usuário:', err);
      setError('Ocorreu um erro ao tentar criar sua conta. Tente novamente mais tarde.');
    } finally {
      setLoading(false);
    }
  };
  
  // Renderizar etapa 1: Informações básicas
  const renderStep1 = () => (
    <>
      <TextField
        margin="normal"
        required
        fullWidth
        id="username"
        label="Nome de usuário"
        name="username"
        autoComplete="username"
        value={userData.username}
        onChange={handleChange}
        disabled={loading}
      />
      
      <TextField
        margin="normal"
        required
        fullWidth
        id="email"
        label="E-mail"
        name="email"
        autoComplete="email"
        type="email"
        value={userData.email}
        onChange={handleChange}
        disabled={loading}
      />
      
      <TextField
        margin="normal"
        required
        fullWidth
        name="password"
        label="Senha"
        type={showPassword ? 'text' : 'password'}
        id="password"
        autoComplete="new-password"
        value={userData.password}
        onChange={handleChange}
        disabled={loading}
        InputProps={{
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
        helperText="A senha deve ter pelo menos 8 caracteres"
      />
      
      <TextField
        margin="normal"
        required
        fullWidth
        name="confirmPassword"
        label="Confirmar senha"
        type={showPassword ? 'text' : 'password'}
        id="confirmPassword"
        value={userData.confirmPassword}
        onChange={handleChange}
        disabled={loading}
      />
    </>
  );
  
  // Renderizar etapa 2: Dados pessoais
  const renderStep2 = () => (
    <>
      <TextField
        margin="normal"
        required
        fullWidth
        id="firstName"
        label="Nome"
        name="firstName"
        autoComplete="given-name"
        value={userData.firstName}
        onChange={handleChange}
        disabled={loading}
      />
      
      <TextField
        margin="normal"
        required
        fullWidth
        id="lastName"
        label="Sobrenome"
        name="lastName"
        autoComplete="family-name"
        value={userData.lastName}
        onChange={handleChange}
        disabled={loading}
      />
    </>
  );
  
  // Renderizar etapa atual
  const getStepContent = (step) => {
    switch (step) {
      case 0:
        return renderStep1();
      case 1:
        return renderStep2();
      default:
        return 'Etapa desconhecida';
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
        <Box sx={{ mb: 4, textAlign: 'center' }}>
          <Typography component="h1" variant="h4" fontWeight="bold" color="primary">
            AdamChat
          </Typography>
          <Typography variant="h5" sx={{ mt: 1 }}>
            Criar Conta
          </Typography>
        </Box>
        
        <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>
        
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
        
        <Box component="form" noValidate>
          {getStepContent(activeStep)}
          
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
            {activeStep > 0 ? (
              <Button
                onClick={handleBack}
                startIcon={<ArrowBack />}
                disabled={loading}
              >
                Voltar
              </Button>
            ) : (
              <div></div>
            )}
            
            <Button
              variant="contained"
              onClick={handleNext}
              disabled={loading || success}
            >
              {loading ? (
                <CircularProgress size={24} />
              ) : activeStep === steps.length - 1 ? (
                'Finalizar'
              ) : (
                'Próximo'
              )}
            </Button>
          </Box>
          
          {success && (
            <Button
              fullWidth
              variant="outlined"
              component={Link}
              to="/login"
              sx={{ mt: 2 }}
            >
              Ir para o Login
            </Button>
          )}
        </Box>
        
        {!success && (
          <Grid container justifyContent="center" sx={{ mt: 3 }}>
            <Grid item>
              <Typography variant="body2">
                Já tem uma conta?{' '}
                <Link to="/login" style={{ textDecoration: 'none' }}>
                  <Typography component="span" variant="body2" color="primary" fontWeight="bold">
                    Entrar
                  </Typography>
                </Link>
              </Typography>
            </Grid>
          </Grid>
        )}
      </Paper>
      
      <Box sx={{ mt: 2, textAlign: 'center' }}>
        <Typography variant="body2" color="text.secondary">
          &copy; {new Date().getFullYear()} AdamChat - Todos os direitos reservados
        </Typography>
      </Box>
    </Container>
  );
};

export default Register; 