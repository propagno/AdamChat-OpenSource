import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  Box, 
  Container, 
  Paper, 
  Typography, 
  Button, 
  Alert, 
  CircularProgress, 
  Divider 
} from '@mui/material';
import axios from 'axios';

/**
 * Componente para gerenciar o callback do OAuth standalone.
 * Extrai parâmetros da URL, processa tokens e exibe resultados.
 */
const OAuthStandaloneCallback = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);
  const [tokenData, setTokenData] = useState(null);
  
  useEffect(() => {
    const processCallback = async () => {
      try {
        // Obter parâmetros da URL
        const params = new URLSearchParams(location.search);
        
        // Verificar se há erro
        const errorParam = params.get('error');
        if (errorParam) {
          const errorDetails = params.get('details') || 'Nenhum detalhe disponível';
          setError(`Erro na autenticação: ${errorParam}. Detalhes: ${errorDetails}`);
          setLoading(false);
          return;
        }
        
        // Verificar sucesso
        const success = params.get('success');
        if (success !== 'true') {
          setError('Resposta inválida do servidor OAuth');
          setLoading(false);
          return;
        }
        
        // Obter ID do token e provedor
        const tokenId = params.get('token_id');
        const provider = params.get('provider');
        
        if (!tokenId) {
          setError('ID do token não encontrado na resposta');
          setLoading(false);
          return;
        }
        
        // Resultado básico
        setResult({
          success: true,
          tokenId,
          provider
        });
        
        // Buscar dados completos do token
        const oauthPort = localStorage.getItem('oauthPort') || '5001';
        const response = await axios.get(`http://localhost:${oauthPort}/token/${tokenId}`);
        
        console.log('Dados do token:', response.data);
        setTokenData(response.data);
        
      } catch (err) {
        console.error('Erro ao processar callback OAuth:', err);
        setError(`Erro: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };
    
    processCallback();
  }, [location]);
  
  const handleBackToTest = () => {
    navigate('/oauth-test');
  };
  
  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom>
        Callback do OAuth Standalone
      </Typography>
      
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="body1" paragraph>
          Esta página processa o callback de autenticação da aplicação OAuth standalone.
        </Typography>
        
        <Button 
          variant="contained" 
          onClick={handleBackToTest}
          sx={{ mt: 2 }}
        >
          Voltar para Testes
        </Button>
      </Paper>
      
      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 3 }}>
          <CircularProgress />
          <Typography variant="body1" sx={{ ml: 2 }}>
            Processando resposta de autenticação...
          </Typography>
        </Box>
      )}
      
      {error && (
        <Alert severity="error" sx={{ mt: 3 }}>
          {error}
        </Alert>
      )}
      
      {result && !loading && (
        <Paper sx={{ p: 3, mt: 3 }}>
          <Typography variant="h6" gutterBottom>
            Autenticação {result.success ? 'bem-sucedida' : 'falhou'}
          </Typography>
          
          <Alert severity={result.success ? "success" : "warning"} sx={{ mb: 3 }}>
            {result.success 
              ? `Autenticação com ${result.provider} concluída com sucesso!` 
              : 'Autenticação falhou. Veja os detalhes abaixo.'}
          </Alert>
          
          <Typography variant="subtitle1" gutterBottom>
            Informações Básicas:
          </Typography>
          
          <Box sx={{ mb: 3 }}>
            <Typography><strong>Provedor:</strong> {result.provider}</Typography>
            <Typography><strong>Token ID:</strong> {result.tokenId}</Typography>
          </Box>
          
          {tokenData && (
            <>
              <Divider sx={{ my: 3 }} />
              
              <Typography variant="subtitle1" gutterBottom>
                Dados do Token:
              </Typography>
              
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
                {JSON.stringify(tokenData, null, 2)}
              </Box>
              
              {tokenData.user_info && (
                <>
                  <Typography variant="subtitle1" gutterBottom sx={{ mt: 3 }}>
                    Informações do Usuário:
                  </Typography>
                  
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    {tokenData.user_info.picture && (
                      <Box 
                        component="img" 
                        src={tokenData.user_info.picture} 
                        alt="User"
                        sx={{ 
                          width: 50, 
                          height: 50, 
                          borderRadius: '50%',
                          mr: 2 
                        }}
                      />
                    )}
                    <Typography variant="h6">
                      {tokenData.user_info.name || tokenData.user_info.login}
                    </Typography>
                  </Box>
                  
                  <Typography>
                    <strong>Email:</strong> {tokenData.user_info.email || 'Não disponível'}
                  </Typography>
                </>
              )}
            </>
          )}
        </Paper>
      )}
    </Container>
  );
};

export default OAuthStandaloneCallback; 