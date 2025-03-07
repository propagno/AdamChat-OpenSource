import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Button, 
  Typography, 
  Paper, 
  Divider, 
  CircularProgress,
  Alert,
  List,
  ListItem,
  ListItemText,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import NetworkCheckIcon from '@mui/icons-material/NetworkCheck';
import axios from 'axios';
import apiClient from '../api/api.client';

/**
 * Componente para diagnóstico de problemas de comunicação com a API
 */
const ApiDiagnostic = () => {
  // Estados para armazenar resultados dos testes
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [healthCheck, setHealthCheck] = useState(null);
  const [routes, setRoutes] = useState([]);
  const [oauthDiagnostic, setOauthDiagnostic] = useState(null);

  /**
   * Executa o diagnóstico completo da API
   */
  const runDiagnostic = async () => {
    setLoading(true);
    setError('');
    
    try {
      // 1. Verificar saúde da API
      await checkApiHealth();
      
      // 2. Obter rotas disponíveis
      await fetchApiRoutes();
      
      // 3. Diagnóstico específico do OAuth
      await checkOAuthDiagnostic();
      
    } catch (err) {
      console.error('Erro no diagnóstico:', err);
      setError(`Erro ao executar diagnóstico: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };
  
  /**
   * Verifica a saúde da API
   */
  const checkApiHealth = async () => {
    try {
      console.log('Verificando saúde da API...');
      const response = await apiClient.get('/api/health');
      console.log('Resposta do health check:', response.data);
      setHealthCheck({
        status: 'success',
        data: response.data
      });
      return true;
    } catch (err) {
      console.error('Erro ao verificar saúde da API:', err);
      setHealthCheck({
        status: 'error',
        error: err.message,
        response: err.response?.data
      });
      // Não propagar o erro para que outros testes possam continuar
      return false;
    }
  };
  
  /**
   * Obtém a lista de rotas disponíveis na API
   */
  const fetchApiRoutes = async () => {
    try {
      console.log('Obtendo rotas da API...');
      const response = await apiClient.get('/api/routes');
      console.log('Rotas disponíveis:', response.data);
      setRoutes(response.data.routes || []);
      return true;
    } catch (err) {
      console.error('Erro ao obter rotas da API:', err);
      setError(prev => prev + `\nErro ao obter rotas: ${err.message}`);
      return false;
    }
  };
  
  /**
   * Verifica o diagnóstico específico do OAuth
   */
  const checkOAuthDiagnostic = async () => {
    try {
      console.log('Verificando diagnóstico OAuth...');
      const response = await apiClient.get('/api/auth/oauth/diagnostic');
      console.log('Diagnóstico OAuth:', response.data);
      setOauthDiagnostic(response.data.diagnostic || {});
      return true;
    } catch (err) {
      console.error('Erro ao verificar diagnóstico OAuth:', err);
      
      // Tentar acessar a rota de provedores como alternativa
      try {
        console.log('Tentando acessar provedores OAuth...');
        const providerResponse = await apiClient.get('/api/auth/oauth/providers');
        console.log('Resposta de provedores:', providerResponse.data);
        setOauthDiagnostic({
          providers_route_working: true,
          providers: providerResponse.data.providers
        });
      } catch (providerErr) {
        console.error('Erro ao acessar provedores OAuth:', providerErr);
        setOauthDiagnostic({
          error: true,
          message: err.message,
          provider_error: providerErr.message
        });
      }
      
      return false;
    }
  };
  
  /**
   * Verifica diretamente um URL específico
   */
  const checkSpecificUrl = async (url) => {
    setLoading(true);
    try {
      // Garantir que a URL comece com http:// ou https://
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        url = `http://${url}`;
      }
      
      console.log(`Verificando URL específico: ${url}`);
      const response = await axios.get(url);
      console.log('Resposta:', response.data);
      alert(`Sucesso! Status: ${response.status}\nDados: ${JSON.stringify(response.data, null, 2)}`);
    } catch (err) {
      console.error(`Erro ao acessar ${url}:`, err);
      alert(`Erro ao acessar ${url}: ${err.message}\n\nDetalhes: ${JSON.stringify(err.response?.data || {}, null, 2)}`);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <Box sx={{ maxWidth: 800, mx: 'auto', my: 4, px: 2 }}>
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h5" gutterBottom>
          <NetworkCheckIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
          Diagnóstico da API
        </Typography>
        
        <Typography variant="body2" color="text.secondary" paragraph>
          Esta ferramenta realiza testes de diagnóstico para identificar problemas na comunicação com a API.
        </Typography>
        
        <Button 
          variant="contained" 
          onClick={runDiagnostic}
          disabled={loading}
          sx={{ mt: 1 }}
        >
          {loading ? <CircularProgress size={24} sx={{ mr: 1 }} /> : 'Executar Diagnóstico'}
        </Button>
      </Paper>
      
      {/* Exibir erro principal */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      
      {/* Resultado do health check */}
      {healthCheck && (
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Verificação de Saúde
          </Typography>
          
          <Alert severity={healthCheck.status === 'success' ? 'success' : 'error'} sx={{ mb: 2 }}>
            {healthCheck.status === 'success' 
              ? 'API está funcionando corretamente!' 
              : `Erro na API: ${healthCheck.error}`}
          </Alert>
          
          {healthCheck.status === 'success' && healthCheck.data && (
            <Box 
              component="pre" 
              sx={{ 
                bgcolor: '#f5f5f5', 
                p: 2, 
                borderRadius: 1,
                overflow: 'auto',
                maxHeight: 200
              }}
            >
              {JSON.stringify(healthCheck.data, null, 2)}
            </Box>
          )}
          
          <Box sx={{ mt: 2 }}>
            <Button 
              variant="outlined" 
              size="small"
              onClick={() => checkSpecificUrl('localhost:5000/api/health')}
            >
              Testar Diretamente
            </Button>
          </Box>
        </Paper>
      )}
      
      {/* Diagnóstico OAuth */}
      {oauthDiagnostic && (
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Diagnóstico OAuth
          </Typography>
          
          {oauthDiagnostic.error ? (
            <Alert severity="error" sx={{ mb: 2 }}>
              Erro no diagnóstico OAuth: {oauthDiagnostic.message}
            </Alert>
          ) : (
            <>
              <Alert severity="info" sx={{ mb: 2 }}>
                Blueprint OAuth: {oauthDiagnostic.blueprint_registered ? 'Registrado' : 'Não registrado'}
                {oauthDiagnostic.blueprint_url_prefix && ` (${oauthDiagnostic.blueprint_url_prefix})`}
              </Alert>
              
              <Typography variant="subtitle2" gutterBottom>
                Provedores Configurados:
              </Typography>
              
              <Box sx={{ mb: 2 }}>
                {oauthDiagnostic.configured_providers ? (
                  Object.entries(oauthDiagnostic.configured_providers).map(([provider, configured]) => (
                    <Chip 
                      key={provider}
                      label={provider}
                      color={configured ? 'success' : 'error'}
                      variant={configured ? 'filled' : 'outlined'}
                      sx={{ mr: 1, mb: 1 }}
                    />
                  ))
                ) : (
                  oauthDiagnostic.providers ? (
                    oauthDiagnostic.providers.map(provider => (
                      <Chip 
                        key={provider}
                        label={provider}
                        color="success"
                        sx={{ mr: 1, mb: 1 }}
                      />
                    ))
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      Informação de provedores não disponível
                    </Typography>
                  )
                )}
              </Box>
              
              <Box sx={{ mt: 2 }}>
                <Button 
                  variant="outlined" 
                  size="small"
                  onClick={() => checkSpecificUrl('localhost:5000/api/auth/oauth/providers')}
                  sx={{ mr: 1 }}
                >
                  Testar Provedores
                </Button>
                
                <Button 
                  variant="outlined" 
                  size="small"
                  onClick={() => checkSpecificUrl('localhost:5000/api/auth/oauth/diagnostic')}
                >
                  Testar Diagnóstico
                </Button>
              </Box>
            </>
          )}
        </Paper>
      )}
      
      {/* Lista de rotas */}
      {routes.length > 0 && (
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Rotas Disponíveis ({routes.length})
          </Typography>
          
          <List sx={{ bgcolor: '#f5f5f5', borderRadius: 1 }}>
            {routes.map((route, index) => (
              <React.Fragment key={route.route}>
                <ListItem>
                  <ListItemText 
                    primary={route.route} 
                    secondary={`Métodos: ${route.methods.join(', ')}`}
                  />
                </ListItem>
                {index < routes.length - 1 && <Divider />}
              </React.Fragment>
            ))}
          </List>
        </Paper>
      )}
    </Box>
  );
};

export default ApiDiagnostic; 