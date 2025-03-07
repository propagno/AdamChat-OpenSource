import React, { useState, useEffect } from 'react';
import { Box, Typography, Button, Paper, Divider, Accordion, AccordionSummary, AccordionDetails } from '@mui/material';
import { ExpandMore, Refresh, Delete, BugReport } from '@mui/icons-material';
import authService from '../api/auth.service';

/**
 * Componente de debug para autenticação
 * Útil durante o desenvolvimento para diagnosticar problemas de autenticação
 */
const AuthDebug = () => {
  const [authState, setAuthState] = useState({
    token: null,
    refreshToken: null,
    user: null,
    decodedToken: null
  });
  
  // Carregar dados de autenticação atuais
  const loadAuthState = () => {
    const token = localStorage.getItem('access_token');
    const refreshToken = localStorage.getItem('refresh_token');
    const userJson = localStorage.getItem('user_info');
    
    let user = null;
    try {
      user = userJson ? JSON.parse(userJson) : null;
    } catch (e) {
      user = { error: 'Erro ao parsear dados do usuário', details: e.message };
    }
    
    // Decodificar token JWT se possível
    const decodedToken = authService.decodeJwt(token);
    
    setAuthState({
      token,
      refreshToken,
      user,
      decodedToken
    });
  };
  
  // Carregar ao montar o componente
  useEffect(() => {
    loadAuthState();
  }, []);
  
  // Limpar estado de autenticação
  const handleClearAuth = () => {
    authService.clearAuthState();
    loadAuthState();
  };
  
  // Gerar um token de desenvolvimento
  const handleGenerateDevToken = () => {
    const devToken = 'dev-token-' + Math.random().toString(36).substring(2);
    const devUser = { 
      id: 'dev-user', 
      email: 'dev@example.com', 
      name: 'Usuário de Teste',
      roles: ['user']
    };
    
    localStorage.setItem('access_token', devToken);
    localStorage.setItem('user_info', JSON.stringify(devUser));
    
    loadAuthState();
  };
  
  return (
    <Paper sx={{ p: 3, m: 2, maxWidth: 800 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h5" component="h2">
          Debug de Autenticação
        </Typography>
        
        <Box>
          <Button 
            startIcon={<Refresh />} 
            variant="outlined" 
            size="small" 
            onClick={loadAuthState}
            sx={{ mr: 1 }}
          >
            Atualizar
          </Button>
          
          <Button 
            startIcon={<Delete />} 
            variant="outlined" 
            color="error"
            size="small" 
            onClick={handleClearAuth}
          >
            Limpar
          </Button>
        </Box>
      </Box>
      
      <Divider sx={{ mb: 2 }} />
      
      <Box sx={{ mb: 2 }}>
        <Typography variant="subtitle1" fontWeight="bold">
          Status da Autenticação:
        </Typography>
        <Typography color={authState.token ? 'success.main' : 'error.main'}>
          {authState.token ? 'Autenticado' : 'Não Autenticado'}
        </Typography>
      </Box>
      
      <Accordion>
        <AccordionSummary expandIcon={<ExpandMore />}>
          <Typography>Token de Acesso</Typography>
        </AccordionSummary>
        <AccordionDetails>
          {authState.token ? (
            <Box 
              component="pre" 
              sx={{ 
                p: 1, 
                bgcolor: 'grey.100', 
                borderRadius: 1, 
                overflow: 'auto',
                fontSize: '0.75rem',
                maxHeight: 100 
              }}
            >
              {authState.token}
            </Box>
          ) : (
            <Typography color="error.main">Nenhum token encontrado</Typography>
          )}
        </AccordionDetails>
      </Accordion>
      
      <Accordion>
        <AccordionSummary expandIcon={<ExpandMore />}>
          <Typography>Token Decodificado</Typography>
        </AccordionSummary>
        <AccordionDetails>
          {authState.decodedToken ? (
            <Box 
              component="pre" 
              sx={{ 
                p: 1, 
                bgcolor: 'grey.100', 
                borderRadius: 1, 
                overflow: 'auto',
                fontSize: '0.75rem' 
              }}
            >
              {JSON.stringify(authState.decodedToken, null, 2)}
            </Box>
          ) : (
            <Typography color="error.main">Nenhum token para decodificar ou token não é JWT</Typography>
          )}
        </AccordionDetails>
      </Accordion>
      
      <Accordion>
        <AccordionSummary expandIcon={<ExpandMore />}>
          <Typography>Informações do Usuário</Typography>
        </AccordionSummary>
        <AccordionDetails>
          {authState.user ? (
            <Box 
              component="pre" 
              sx={{ 
                p: 1, 
                bgcolor: 'grey.100', 
                borderRadius: 1, 
                overflow: 'auto',
                fontSize: '0.75rem' 
              }}
            >
              {JSON.stringify(authState.user, null, 2)}
            </Box>
          ) : (
            <Typography color="error.main">Nenhuma informação de usuário encontrada</Typography>
          )}
        </AccordionDetails>
      </Accordion>
      
      <Box sx={{ mt: 3 }}>
        <Button 
          startIcon={<BugReport />} 
          variant="contained" 
          color="secondary"
          onClick={handleGenerateDevToken}
          fullWidth
        >
          Gerar Token de Desenvolvimento
        </Button>
        <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
          Use apenas em ambiente de desenvolvimento para testes!
        </Typography>
      </Box>
    </Paper>
  );
};

export default AuthDebug; 