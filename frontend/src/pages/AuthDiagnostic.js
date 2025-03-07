import React, { useState, useEffect } from 'react';
import { Box, Container, Typography, Paper, Button, Grid, Alert, CircularProgress, Divider, List, ListItem, ListItemText, Chip } from '@mui/material';
import { Check as CheckIcon, Error as ErrorIcon, Refresh as RefreshIcon, Home as HomeIcon } from '@mui/icons-material';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import authHelper from '../services/auth-helper';

/**
 * Página de diagnóstico de autenticação
 * Fornece ferramentas para verificar e resolver problemas de autenticação
 */
const AuthDiagnostic = () => {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading, user, logout } = useAuth();
  const [diagResults, setDiagResults] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Executar diagnóstico ao carregar a página
  useEffect(() => {
    runDiagnostic();
  }, []);
  
  // Função para executar diagnóstico completo
  const runDiagnostic = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const results = await authHelper.runAuthDiagnostic();
      setDiagResults(results);
    } catch (err) {
      console.error('Erro ao executar diagnóstico:', err);
      setError('Falha ao executar diagnóstico. Verifique o console para mais detalhes.');
    } finally {
      setLoading(false);
    }
  };
  
  // Função para forçar logout e limpar dados
  const handleForceLogout = () => {
    authHelper.forceLogout();
  };
  
  // Função para restaurar estado de autenticação
  const handleResetAuth = () => {
    authHelper.forceLogout();
    setTimeout(() => {
      navigate('/login');
    }, 500);
  };
  
  // Renderizar estado de carregamento
  if (loading) {
    return (
      <Container maxWidth="md" sx={{ mt: 8 }}>
        <Paper elevation={3} sx={{ p: 4, textAlign: 'center' }}>
          <CircularProgress size={60} sx={{ mb: 3 }} />
          <Typography variant="h5">
            Executando diagnóstico de autenticação...
          </Typography>
        </Paper>
      </Container>
    );
  }
  
  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 8 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4" component="h1" gutterBottom>
            Diagnóstico de Autenticação
          </Typography>
          
          <Button 
            variant="outlined" 
            startIcon={<RefreshIcon />}
            onClick={runDiagnostic}
          >
            Atualizar
          </Button>
        </Box>
        
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}
        
        {/* Status atual */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h5" gutterBottom>
            Status atual
          </Typography>
          
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Paper variant="outlined" sx={{ p: 2 }}>
                <Typography variant="subtitle1" gutterBottom>
                  Autenticação
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  {isAuthenticated ? (
                    <Chip 
                      icon={<CheckIcon />} 
                      label="Autenticado" 
                      color="success" 
                      variant="outlined" 
                    />
                  ) : (
                    <Chip 
                      icon={<ErrorIcon />} 
                      label="Não autenticado" 
                      color="error" 
                      variant="outlined" 
                    />
                  )}
                </Box>
              </Paper>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Paper variant="outlined" sx={{ p: 2 }}>
                <Typography variant="subtitle1" gutterBottom>
                  API de autenticação
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  {diagResults?.api?.online ? (
                    <Chip 
                      icon={<CheckIcon />} 
                      label="Online" 
                      color="success" 
                      variant="outlined" 
                    />
                  ) : (
                    <Chip 
                      icon={<ErrorIcon />} 
                      label="Offline" 
                      color="error" 
                      variant="outlined" 
                    />
                  )}
                </Box>
              </Paper>
            </Grid>
          </Grid>
        </Box>
        
        {/* Resultados do diagnóstico */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h5" gutterBottom>
            Detalhes do diagnóstico
          </Typography>
          
          <Grid container spacing={2}>
            {/* LocalStorage */}
            <Grid item xs={12}>
              <Paper variant="outlined" sx={{ p: 2 }}>
                <Typography variant="subtitle1" gutterBottom fontWeight="bold">
                  Armazenamento local
                </Typography>
                
                {diagResults?.localStorage?.available ? (
                  <List dense>
                    <ListItem>
                      <ListItemText 
                        primary="Access Token" 
                        secondary={diagResults.localStorage.hasAccessToken ? 'Presente' : 'Ausente'} 
                      />
                      {diagResults.localStorage.hasAccessToken ? (
                        <Chip size="small" label="OK" color="success" />
                      ) : (
                        <Chip size="small" label="Problema" color="error" />
                      )}
                    </ListItem>
                    
                    <ListItem>
                      <ListItemText 
                        primary="Refresh Token" 
                        secondary={diagResults.localStorage.hasRefreshToken ? 'Presente' : 'Ausente'} 
                      />
                      {diagResults.localStorage.hasRefreshToken ? (
                        <Chip size="small" label="OK" color="success" />
                      ) : (
                        <Chip size="small" label="Problema" color="error" />
                      )}
                    </ListItem>
                    
                    <ListItem>
                      <ListItemText 
                        primary="Dados de usuário" 
                        secondary={diagResults.localStorage.hasUserInfo ? 'Presente' : 'Ausente'} 
                      />
                      {diagResults.localStorage.hasUserInfo ? (
                        <Chip size="small" label="OK" color="success" />
                      ) : (
                        <Chip size="small" label="Problema" color="error" />
                      )}
                    </ListItem>
                  </List>
                ) : (
                  <Alert severity="error">
                    LocalStorage não disponível: {diagResults?.localStorage?.error}
                  </Alert>
                )}
              </Paper>
            </Grid>
            
            {/* Token */}
            <Grid item xs={12}>
              <Paper variant="outlined" sx={{ p: 2 }}>
                <Typography variant="subtitle1" gutterBottom fontWeight="bold">
                  Validação de token
                </Typography>
                
                {diagResults?.tokens ? (
                  diagResults.tokens.valid ? (
                    <Alert severity="success">
                      Token válido
                    </Alert>
                  ) : (
                    <Alert severity="error">
                      Token inválido: {diagResults.tokens.error || 'Token expirado ou inválido'}
                    </Alert>
                  )
                ) : (
                  <Alert severity="warning">
                    Validação de token não executada
                  </Alert>
                )}
              </Paper>
            </Grid>
          </Grid>
        </Box>
        
        {/* Ações */}
        <Box>
          <Typography variant="h5" gutterBottom>
            Ações de recuperação
          </Typography>
          
          <Grid container spacing={2}>
            <Grid item>
              <Button 
                variant="contained" 
                color="error" 
                onClick={handleForceLogout}
              >
                Forçar Logout
              </Button>
            </Grid>
            
            <Grid item>
              <Button 
                variant="contained" 
                color="warning" 
                onClick={handleResetAuth}
              >
                Limpar e Reiniciar
              </Button>
            </Grid>
            
            <Grid item>
              <Button 
                variant="contained" 
                color="primary" 
                component={Link} 
                to="/login"
              >
                Ir para Login
              </Button>
            </Grid>
            
            <Grid item>
              <Button 
                variant="outlined" 
                startIcon={<HomeIcon />} 
                component={Link} 
                to="/"
              >
                Voltar para Início
              </Button>
            </Grid>
          </Grid>
        </Box>
      </Paper>
    </Container>
  );
};

export default AuthDiagnostic; 