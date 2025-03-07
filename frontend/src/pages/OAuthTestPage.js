import React, { useState, useEffect } from 'react';
import { Box, Container, Paper, Typography, Button, Alert, TextField, Divider, CircularProgress } from '@mui/material';
import axios from 'axios';

/**
 * Página para testar a aplicação OAuth standalone.
 * Esta página contém botões e funções para testar todas as rotas
 * da aplicação OAuth standalone.
 */
const OAuthTestPage = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);
  const [oauthPort, setOauthPort] = useState('5001');

  // URL base para a aplicação OAuth standalone
  const getBaseUrl = () => `http://localhost:${oauthPort}`;

  // Salvar a porta no localStorage quando mudar
  useEffect(() => {
    localStorage.setItem('oauthPort', oauthPort);
  }, [oauthPort]);

  // Testar a rota de saúde
  const testHealth = async () => {
    setLoading(true);
    setError('');
    setResult(null);
    
    try {
      const response = await axios.get(`${getBaseUrl()}/health`);
      console.log('Resposta da rota de saúde:', response.data);
      setResult({
        title: 'Teste de Saúde',
        data: response.data
      });
    } catch (err) {
      console.error('Erro ao testar rota de saúde:', err);
      setError(`Erro: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Testar a rota de provedores
  const testProviders = async () => {
    setLoading(true);
    setError('');
    setResult(null);
    
    try {
      const response = await axios.get(`${getBaseUrl()}/providers`);
      console.log('Resposta da rota de provedores:', response.data);
      setResult({
        title: 'Provedores OAuth',
        data: response.data
      });
    } catch (err) {
      console.error('Erro ao testar rota de provedores:', err);
      setError(`Erro: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Testar a rota de tokens
  const testTokens = async () => {
    setLoading(true);
    setError('');
    setResult(null);
    
    try {
      const response = await axios.get(`${getBaseUrl()}/test-tokens`);
      console.log('Resposta da rota de tokens:', response.data);
      setResult({
        title: 'Tokens de Teste',
        data: response.data
      });
    } catch (err) {
      console.error('Erro ao testar rota de tokens:', err);
      setError(`Erro: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Testar o fluxo de autorização completo
  const testAuthorize = (provider) => {
    // Abrir uma nova janela com a URL de autorização
    const authUrl = `${getBaseUrl()}/authorize/${provider}`;
    console.log(`Abrindo URL de autorização: ${authUrl}`);
    window.open(authUrl, '_blank');
  };

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom>
        Teste de OAuth Standalone
      </Typography>
      
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Configuração
        </Typography>
        
        <TextField
          label="Porta da Aplicação OAuth"
          value={oauthPort}
          onChange={(e) => setOauthPort(e.target.value)}
          type="number"
          size="small"
          sx={{ mb: 2 }}
        />
        
        <Typography variant="body2" color="text.secondary" paragraph>
          Certifique-se de que a aplicação OAuth standalone esteja rodando na porta especificada.
          Para iniciar, execute <code>python oauth_standalone.py</code> no diretório backend.
        </Typography>
      </Paper>
      
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Testes Básicos
        </Typography>
        
        <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
          <Button 
            variant="contained" 
            onClick={testHealth}
            disabled={loading}
          >
            Verificar Saúde
          </Button>
          
          <Button 
            variant="contained" 
            onClick={testProviders}
            disabled={loading}
          >
            Listar Provedores
          </Button>
          
          <Button 
            variant="contained" 
            onClick={testTokens}
            disabled={loading}
          >
            Testar Tokens
          </Button>
        </Box>
      </Paper>
      
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Testar Fluxo OAuth Completo
        </Typography>
        
        <Typography variant="body2" color="text.secondary" paragraph>
          Clique em um dos botões abaixo para testar o fluxo OAuth completo. Isso abrirá uma nova janela
          que deve redirecionar para o provedor e depois de volta para a página de callback.
        </Typography>
        
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <Button 
            variant="outlined" 
            onClick={() => testAuthorize('google')}
            disabled={loading}
          >
            Testar Google
          </Button>
          
          <Button 
            variant="outlined" 
            onClick={() => testAuthorize('facebook')}
            disabled={loading}
          >
            Testar Facebook
          </Button>
          
          <Button 
            variant="outlined" 
            onClick={() => testAuthorize('github')}
            disabled={loading}
          >
            Testar GitHub
          </Button>
        </Box>
      </Paper>
      
      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 3 }}>
          <CircularProgress />
        </Box>
      )}
      
      {error && (
        <Alert severity="error" sx={{ mt: 3 }}>
          {error}
        </Alert>
      )}
      
      {result && (
        <Paper sx={{ p: 3, mt: 3 }}>
          <Typography variant="h6" gutterBottom>
            {result.title}
          </Typography>
          
          <Divider sx={{ my: 2 }} />
          
          <Box 
            component="pre" 
            sx={{ 
              bgcolor: '#f5f5f5', 
              p: 2, 
              borderRadius: 1,
              overflow: 'auto',
              maxHeight: 400
            }}
          >
            {JSON.stringify(result.data, null, 2)}
          </Box>
        </Paper>
      )}
    </Container>
  );
};

export default OAuthTestPage; 