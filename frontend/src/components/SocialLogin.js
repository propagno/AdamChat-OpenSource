import React, { useState, useEffect } from 'react';
import { Button, Box, Typography, Divider, CircularProgress } from '@mui/material';
import { styled } from '@mui/material/styles';
import GoogleIcon from '@mui/icons-material/Google';
import FacebookIcon from '@mui/icons-material/Facebook';
import GitHubIcon from '@mui/icons-material/GitHub';
import apiClient from '../api/api.client';

// Estilos personalizados para os botões de login social
const SocialButton = styled(Button)(({ theme, provider }) => ({
  width: '100%',
  marginBottom: theme.spacing(1.5),
  padding: theme.spacing(1.2),
  textTransform: 'none',
  fontWeight: 500,
  borderRadius: theme.shape.borderRadius,
  ...(provider === 'google' && {
    backgroundColor: '#ffffff',
    color: '#757575',
    border: '1px solid #dddddd',
    '&:hover': {
      backgroundColor: '#f1f1f1',
    },
  }),
  ...(provider === 'facebook' && {
    backgroundColor: '#3b5998',
    color: '#ffffff',
    '&:hover': {
      backgroundColor: '#344e86',
    },
  }),
  ...(provider === 'github' && {
    backgroundColor: '#24292e',
    color: '#ffffff',
    '&:hover': {
      backgroundColor: '#1a1e22',
    },
  }),
}));

// Ícones para os botões de login social
const SocialIcon = ({ provider }) => {
  switch (provider) {
    case 'google':
      return <GoogleIcon sx={{ mr: 1 }} />;
    case 'facebook':
      return <FacebookIcon sx={{ mr: 1 }} />;
    case 'github':
      return <GitHubIcon sx={{ mr: 1 }} />;
    default:
      return null;
  }
};

const SocialLogin = () => {
  const [availableProviders, setAvailableProviders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Carregar provedores disponíveis do backend
  useEffect(() => {
    const fetchProviders = async () => {
      try {
        setLoading(true);
        console.log('Buscando provedores OAuth disponíveis...');
        
        const response = await apiClient.get('/api/auth/oauth/providers');
        console.log('Resposta da API de provedores:', response.data);
        
        if (response.data.status === 'success' && response.data.providers) {
          setAvailableProviders(response.data.providers);
          console.log('Provedores disponíveis:', response.data.providers);
        } else {
          console.error('Resposta inválida da API:', response.data);
          setError('Não foi possível carregar os provedores de login social.');
        }
      } catch (err) {
        console.error('Erro ao carregar provedores OAuth:', err);
        
        // Mensagem de erro mais detalhada para diagnóstico
        if (err.response) {
          console.error('Detalhes do erro:', {
            status: err.response.status,
            data: err.response.data
          });
        }
        
        setError('Erro ao carregar opções de login social.');
      } finally {
        setLoading(false);
      }
    };

    fetchProviders();
  }, []);

  // Iniciar o fluxo de autorização OAuth
  const handleSocialLogin = (provider) => {
    console.log(`Iniciando login com provedor: ${provider}`);
    
    // URL completa para o backend
    const backendUrl = apiClient.defaults.baseURL;
    const authUrl = `${backendUrl}/api/auth/oauth/authorize/${provider}`;
    
    // Log da URL para debugging
    console.log(`Redirecionando para URL: ${authUrl}`);
    
    // Redirecionar para o endpoint de autorização do backend
    window.location.href = authUrl;
  };

  // Função para obter o nome de exibição para cada provedor
  const getProviderDisplayName = (provider) => {
    switch (provider) {
      case 'google':
        return 'Google';
      case 'facebook':
        return 'Facebook';
      case 'github':
        return 'GitHub';
      default:
        return provider.charAt(0).toUpperCase() + provider.slice(1);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', my: 3 }}>
        <CircularProgress size={24} />
      </Box>
    );
  }

  // Se não houver provedores disponíveis, não mostrar nada
  if (availableProviders.length === 0 && !error) {
    return null;
  }

  return (
    <Box sx={{ width: '100%', mt: 2, mb: 3 }}>
      {error ? (
        <Typography color="error" variant="body2" align="center" sx={{ mb: 2 }}>
          {error}
        </Typography>
      ) : availableProviders.length > 0 && (
        <>
          <Divider sx={{ my: 2 }}>
            <Typography variant="body2" color="text.secondary">
              ou continue com
            </Typography>
          </Divider>
          
          <Box sx={{ mt: 2 }}>
            {availableProviders.map((provider) => (
              <SocialButton
                key={provider}
                provider={provider}
                startIcon={<SocialIcon provider={provider} />}
                onClick={() => handleSocialLogin(provider)}
                variant="contained"
                disableElevation
              >
                Entrar com {getProviderDisplayName(provider)}
              </SocialButton>
            ))}
          </Box>
        </>
      )}
    </Box>
  );
};

export default SocialLogin; 