import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Box,
  Button,
  Container,
  TextField,
  Typography,
  Paper,
  Alert,
  CircularProgress,
  Divider
} from '@mui/material';
import { Email } from '@mui/icons-material';
import authService from '../api/auth.service';

/**
 * Página para solicitar redefinição de senha
 */
const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [emailError, setEmailError] = useState('');
  
  // Validar email
  const validateEmail = () => {
    setEmailError('');
    
    if (!email.trim()) {
      setEmailError('E-mail é obrigatório');
      return false;
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setEmailError('E-mail inválido');
      return false;
    }
    
    return true;
  };
  
  // Manipular submissão do formulário
  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    if (!validateEmail()) {
      return;
    }
    
    setLoading(true);
    
    try {
      console.log(`Enviando solicitação de redefinição para: ${email}`);
      const response = await authService.requestPasswordReset(email);
      
      // Sempre mostrar mensagem de sucesso, mesmo se o email não existir
      // (por segurança, não revelamos se o email existe ou não)
      setSuccess(
        response.message || 
        'Se este e-mail estiver cadastrado, você receberá um link para redefinir sua senha em breve.'
      );
      
      // Limpar campo de email
      setEmail('');
    } catch (err) {
      console.error('Erro ao solicitar redefinição de senha:', err);
      
      // Mensagens de erro mais amigáveis
      if (err.message.includes('não disponível')) {
        setError('O serviço de redefinição de senha está temporariamente indisponível. Por favor, tente novamente mais tarde ou entre em contato com o suporte.');
      } else if (err.message.includes('inválido')) {
        setError('O email informado parece ser inválido. Verifique se digitou corretamente.');
      } else if (err.message.includes('Muitas tentativas')) {
        setError('Você fez muitas tentativas. Por favor, aguarde alguns minutos antes de tentar novamente.');
      } else if (err.message.includes('conexão')) {
        setError('Não foi possível conectar ao servidor. Verifique sua conexão com a internet e tente novamente.');
      } else {
        setError(err.message || 'Ocorreu um erro ao processar sua solicitação. Tente novamente mais tarde.');
      }
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
            Recuperar Senha
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
        
        <Typography variant="body1" sx={{ mb: 3 }}>
          Informe seu e-mail cadastrado e enviaremos instruções para redefinir sua senha.
        </Typography>
        
        <Box component="form" onSubmit={onSubmit} noValidate>
          <TextField
            margin="normal"
            required
            fullWidth
            id="email"
            label="E-mail"
            name="email"
            autoComplete="email"
            autoFocus
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            error={!!emailError}
            helperText={emailError}
            disabled={loading}
            InputProps={{
              startAdornment: (
                <Email color="action" sx={{ mr: 1 }} />
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
            {loading ? <CircularProgress size={24} /> : 'Enviar instruções'}
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
      </Paper>
    </Container>
  );
};

export default ForgotPassword; 