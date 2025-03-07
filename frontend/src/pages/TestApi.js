import React, { useState, useEffect } from 'react';
import { Box, Typography, Button, Paper, CircularProgress, Alert, Divider } from '@mui/material';
import axios from 'axios';

/**
 * Página para testar a conexão com a API
 */
const TestApi = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [oauthProviders, setOauthProviders] = useState([]);
  const [healthStatus, setHealthStatus] = useState(null);
  const [success, setSuccess] = useState(null);

  // Testar a API de saúde
  const testHealthApi = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await axios.get('/api/health');
      console.log('Health API response:', response.data);
      setHealthStatus(response.data);
    } catch (err) {
      console.error('Error testing health API:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Testar a API de provedores OAuth
  const testOauthProvidersApi = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await axios.get('/api/auth/oauth/providers');
      console.log('OAuth Providers API response:', response.data);
      setOauthProviders(response.data.providers || []);
    } catch (err) {
      console.error('Error testing OAuth providers API:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Testar o redirecionamento OAuth
  const testOauthRedirect = (provider) => {
    // URL completa para o backend (contornando o proxy)
    const backendUrl = 'http://localhost:5000';
    const authUrl = `${backendUrl}/api/auth/oauth/authorize/${provider}`;
    
    // Log da URL para debugging
    console.log(`Redirecionando para URL completa: ${authUrl}`);
    
    // Abrir em uma nova aba
    window.open(authUrl, '_blank');
  };
  
  // Testar rota direta de OAuth (sem blueprint)
  const testDirectOauth = () => {
    // URL direta para teste OAuth
    const backendUrl = 'http://localhost:5000';
    const testUrl = `${backendUrl}/direct-oauth-test`;
    
    // Log da URL para debugging
    console.log(`Testando rota direta: ${testUrl}`);
    
    // Fazer requisição para a rota
    setLoading(true);
    axios.get(testUrl)
      .then(response => {
        console.log('Resposta da rota direta:', response.data);
        setSuccess(`Rota direta funcionando! Timestamp: ${response.data.timestamp}`);
      })
      .catch(err => {
        console.error('Erro ao testar rota direta:', err);
        setError(`Erro na rota direta: ${err.message}`);
      })
      .finally(() => {
        setLoading(false);
      });
  };
  
  // Testar mock direto de OAuth (sem blueprint)
  const testDirectMock = () => {
    // URL direta para mock OAuth
    const backendUrl = 'http://localhost:5000';
    const mockUrl = `${backendUrl}/direct-oauth-mock`;
    
    // Log da URL para debugging
    console.log(`Redirecionando para mock direto: ${mockUrl}`);
    
    // Abrir em uma nova aba
    window.open(mockUrl, '_blank');
  };

  useEffect(() => {
    // Testar automaticamente a API de saúde ao carregar
    testHealthApi();
  }, []);

  return (
    <Box sx={{ p: 4, maxWidth: 800, mx: 'auto' }}>
      <Typography variant="h4" gutterBottom>
        Teste de API
      </Typography>
      
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Status do Backend
        </Typography>
        
        <Button 
          variant="contained" 
          onClick={testHealthApi} 
          disabled={loading}
          sx={{ mb: 2 }}
        >
          {loading ? <CircularProgress size={24} /> : 'Testar API de Saúde'}
        </Button>
        
        {healthStatus && (
          <Box sx={{ mt: 2 }}>
            <Alert severity="success">
              Backend está respondendo!
            </Alert>
            <Typography variant="body2" sx={{ mt: 1 }}>
              <pre>{JSON.stringify(healthStatus, null, 2)}</pre>
            </Typography>
          </Box>
        )}
      </Paper>
      
      <Divider sx={{ my: 3 }} />
      
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Teste de OAuth
        </Typography>
        
        <Button 
          variant="contained" 
          onClick={testOauthProvidersApi} 
          disabled={loading}
          sx={{ mb: 2 }}
        >
          {loading ? <CircularProgress size={24} /> : 'Listar Provedores OAuth'}
        </Button>
        
        {oauthProviders.length > 0 && (
          <Box sx={{ mt: 2 }}>
            <Alert severity="success">
              {oauthProviders.length} provedores disponíveis!
            </Alert>
            
            <Box sx={{ mt: 2 }}>
              {oauthProviders.map(provider => (
                <Button 
                  key={provider}
                  variant="outlined" 
                  onClick={() => testOauthRedirect(provider)}
                  sx={{ mr: 1, mb: 1 }}
                >
                  Testar {provider.charAt(0).toUpperCase() + provider.slice(1)}
                </Button>
              ))}
            </Box>
          </Box>
        )}
        
        {error && (
          <Alert severity="error" sx={{ mt: 2 }}>
            Erro: {error}
          </Alert>
        )}
      </Paper>
      
      <Divider sx={{ my: 3 }} />
      
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Teste de OAuth Direto
        </Typography>
        
        <Button 
          variant="contained" 
          onClick={testDirectOauth} 
          disabled={loading}
          sx={{ mb: 2 }}
        >
          {loading ? <CircularProgress size={24} /> : 'Testar Rota Direta de OAuth'}
        </Button>
        
        {success && (
          <Box sx={{ mt: 2 }}>
            <Alert severity="success">
              {success}
            </Alert>
          </Box>
        )}
      </Paper>
      
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Teste de Mock Direto
        </Typography>
        
        <Button 
          variant="contained" 
          onClick={testDirectMock} 
          disabled={loading}
          sx={{ mb: 2 }}
        >
          {loading ? <CircularProgress size={24} /> : 'Testar Mock Direto'}
        </Button>
      </Paper>
    </Box>
  );
};

export default TestApi; 