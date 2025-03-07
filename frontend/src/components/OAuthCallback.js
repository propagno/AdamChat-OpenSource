import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Container, Box, Typography, CircularProgress, Alert, Paper, Button } from '@mui/material';
import authService from '../api/auth.service';
import { useAuth } from '../contexts/AuthContext';
import { setLocalStorageItem } from '../utils/storage';
import { STORAGE_KEYS } from '../api/api.client';

/**
 * Componente para processar callbacks OAuth de provedores sociais.
 * Este componente detecta parâmetros na URL após redirecionamento OAuth
 * e processa a autenticação automaticamente.
 */
const OAuthCallback = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [debugInfo, setDebugInfo] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { setIsAuthenticated, setUser } = useAuth();

  useEffect(() => {
    console.log("OAuthCallback montado - processando parâmetros de URL:", location.search);
    
    const processCallback = async () => {
      try {
        setLoading(true);
        
        // Extrair parâmetros diretamente da URL atual
        const params = new URLSearchParams(location.search);
        const queryParams = Object.fromEntries(params.entries());
        console.log("Parâmetros de URL:", queryParams);
        
        // Armazenar informações de debug
        setDebugInfo(queryParams);
        
        // Verificar se há um erro na URL
        const errorParam = params.get('error');
        if (errorParam) {
          const errorDesc = params.get('error_description') || 'Erro desconhecido';
          console.error(`Erro OAuth: ${errorParam} - ${errorDesc}`);
          setError(`Erro: ${errorDesc}`);
          
          // Redirecionar para login após um erro
          setTimeout(() => {
            navigate('/login', { state: { error: errorDesc, type: 'oauth' } });
          }, 3000);
          return;
        }
        
        // Verificar se temos os tokens na URL
        const accessToken = params.get('access_token');
        const refreshToken = params.get('refresh_token');
        
        if (!accessToken || !refreshToken) {
          console.error('Tokens ausentes na URL de callback:', location.search);
          setError('Não foi possível completar a autenticação. Tokens ausentes na URL.');
          
          setTimeout(() => {
            navigate('/login', { 
              state: { 
                error: 'Falha na autenticação. Tokens ausentes.', 
                type: 'oauth',
                url: location.pathname + location.search 
              } 
            });
          }, 3000);
          return;
        }
        
        console.log('Tokens encontrados, processando autenticação...');
        
        try {
          // Armazenar os tokens usando as funções e constantes padrão
          setLocalStorageItem(STORAGE_KEYS.ACCESS_TOKEN, accessToken);
          setLocalStorageItem(STORAGE_KEYS.REFRESH_TOKEN, refreshToken);
          
          // Decodificar o token para obter informações do usuário
          const decodedToken = authService.decodeJwt(accessToken);
          console.log('Token decodificado:', decodedToken);
          
          if (decodedToken) {
            // Armazenar informações do usuário
            const userData = {
              id: decodedToken.sub,
              email: decodedToken.email || 'usuario@exemplo.com',
              name: decodedToken.name || decodedToken.email?.split('@')[0] || 'Usuário',
              roles: decodedToken.roles || ['user']
            };
            
            // Armazenar dados do usuário no localStorage
            setLocalStorageItem(STORAGE_KEYS.USER_DATA, userData);
            
            // Atualizar o contexto de autenticação
            setIsAuthenticated(true);
            setUser(userData);
            
            // Mostrar mensagem de sucesso
            setSuccess(`Login realizado com sucesso! Bem-vindo, ${userData.name}!`);
            setLoading(false);

            // Redirecionar para o dashboard imediatamente
            console.log('Redirecionando para o dashboard...');
            
            // Pequeno delay apenas para mostrar a mensagem de sucesso
            setTimeout(() => {
              navigate('/dashboard', { 
                replace: true,
                state: { 
                  from: 'oauth',
                  provider: queryParams.provider || 'unknown',
                  newLogin: true 
                }
              });
            }, 1000);
          } else {
            throw new Error('Token inválido ou mal-formado');
          }
        } catch (tokenError) {
          console.error('Erro ao processar token:', tokenError);
          setError(`Erro ao processar token: ${tokenError.message}`);
          
          setTimeout(() => {
            navigate('/login', { 
              state: { 
                error: `Falha ao processar token: ${tokenError.message}`, 
                type: 'oauth'
              } 
            });
          }, 3000);
        }
      } catch (err) {
        console.error('Erro ao processar callback OAuth:', err);
        setError(`Erro durante a autenticação: ${err.message}`);
        
        setTimeout(() => {
          navigate('/login', { 
            state: { 
              error: `Falha na autenticação social: ${err.message}`,
              type: 'oauth'
            } 
          });
        }, 3000);
      } finally {
        setLoading(false);
      }
    };

    // Adicionar um pequeno delay para garantir que a URL esteja totalmente carregada
    const timer = setTimeout(() => {
      processCallback();
    }, 300);

    return () => clearTimeout(timer);
  }, [navigate, location.search, setIsAuthenticated, setUser]);

  // Função para ir diretamente para o Dashboard
  const handleGoToDashboard = () => {
    navigate('/dashboard', { replace: true });
  };

  // Função para voltar manualmente para a página de login
  const handleGoToLogin = () => {
    navigate('/login');
  };

  return (
    <Container component="main" maxWidth="sm">
      <Paper elevation={3} sx={{ p: 4, mt: 8, borderRadius: 2 }}>
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center',
          }}
        >
          <Typography component="h1" variant="h5" gutterBottom>
            Processando Autenticação
          </Typography>
          
          {loading && (
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mt: 4, mb: 4 }}>
              <CircularProgress size={60} />
              <Typography variant="body1" sx={{ mt: 2 }}>
                Finalizando o processo de autenticação...
              </Typography>
            </Box>
          )}
          
          {success && (
            <>
              <Alert severity="success" sx={{ width: '100%', mt: 2, mb: 2 }}>
                {success}
              </Alert>
              <Button 
                variant="contained" 
                color="primary"
                onClick={handleGoToDashboard}
                sx={{ mt: 2 }}
              >
                Ir para o Dashboard
              </Button>
            </>
          )}
          
          {error && (
            <>
              <Alert severity="error" sx={{ width: '100%', mt: 2, mb: 2 }}>
                {error}
              </Alert>
              <Button 
                variant="contained" 
                onClick={handleGoToLogin}
                sx={{ mt: 2 }}
              >
                Voltar para o Login
              </Button>
            </>
          )}
          
          {debugInfo && !success && (
            <Box sx={{ mt: 4, p: 2, bgcolor: '#f5f5f5', borderRadius: 1, width: '100%', overflow: 'auto' }}>
              <Typography variant="subtitle2" gutterBottom>
                Informações de Diagnóstico (Apenas em Desenvolvimento):
              </Typography>
              <pre style={{ whiteSpace: 'pre-wrap', fontSize: '0.8rem' }}>
                {JSON.stringify(debugInfo, null, 2)}
              </pre>
            </Box>
          )}
        </Box>
      </Paper>
    </Container>
  );
};

export default OAuthCallback; 