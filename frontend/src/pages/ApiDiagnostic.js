import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  Container,
  Typography,
  Paper,
  Box,
  Button,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  CircularProgress,
  Alert,
  IconButton,
  Chip
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  ArrowBack as ArrowBackIcon,
  Refresh as RefreshIcon,
  Cable as CableIcon,
  Code as CodeIcon,
  Storage as StorageIcon,
  Security as SecurityIcon
} from '@mui/icons-material';

// Variantes de animação
const pageVariants = {
  initial: {
    opacity: 0,
    y: 20
  },
  in: {
    opacity: 1,
    y: 0
  },
  out: {
    opacity: 0,
    y: -20
  }
};

const pageTransition = {
  type: 'tween',
  ease: 'anticipate',
  duration: 0.5
};

const ApiDiagnostic = () => {
  const [services, setServices] = useState([
    { id: 'auth', name: 'Autenticação', status: 'pending', endpoint: '/api/auth/status' },
    { id: 'chat', name: 'API de Chat', status: 'pending', endpoint: '/api/chat/status' },
    { id: 'library', name: 'Biblioteca', status: 'pending', endpoint: '/api/library/status' },
    { id: 'users', name: 'Usuários', status: 'pending', endpoint: '/api/users/status' },
    { id: 'video', name: 'Geração de Vídeo', status: 'pending', endpoint: '/api/video/status' }
  ]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastChecked, setLastChecked] = useState(null);

  useEffect(() => {
    checkAllServices();
  }, []);

  const checkAllServices = async () => {
    setLoading(true);
    setError(null);

    try {
      // Em uma implementação real, você faria chamadas reais para cada endpoint
      // Aqui vamos simular respostas para demonstração
      const updatedServices = await Promise.all(
        services.map(async (service) => {
          try {
            // Simulando uma chamada de API com um atraso aleatório
            await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 500));
            
            // Simulando resposta da API
            // Em uma implementação real, você faria fetch() para o endpoint real
            const status = Math.random() > 0.2 ? 'online' : 'offline';
            
            return {
              ...service,
              status,
              lastCheck: new Date().toISOString(),
              responseTime: Math.floor(Math.random() * 200) + 50 // ms
            };
          } catch (err) {
            return {
              ...service,
              status: 'error',
              lastCheck: new Date().toISOString(),
              error: err.message
            };
          }
        })
      );

      setServices(updatedServices);
      setLastChecked(new Date());
    } catch (err) {
      setError('Erro ao verificar status dos serviços: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'online':
        return <CheckCircleIcon color="success" />;
      case 'offline':
        return <ErrorIcon color="error" />;
      case 'pending':
        return <CircularProgress size={20} />;
      default:
        return <ErrorIcon color="warning" />;
    }
  };

  const getStatusChip = (status) => {
    let color = 'default';
    let label = 'Desconhecido';

    switch (status) {
      case 'online':
        color = 'success';
        label = 'Online';
        break;
      case 'offline':
        color = 'error';
        label = 'Offline';
        break;
      case 'pending':
        color = 'warning';
        label = 'Verificando...';
        break;
      case 'error':
        color = 'error';
        label = 'Erro';
        break;
      default:
        break;
    }

    return (
      <Chip 
        label={label} 
        color={color} 
        size="small" 
        variant={status === 'pending' ? 'outlined' : 'filled'}
      />
    );
  };

  return (
    <motion.div
      initial="initial"
      animate="in"
      exit="out"
      variants={pageVariants}
      transition={pageTransition}
    >
      <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <IconButton 
            component={Link} 
            to="/dashboard"
            sx={{ mr: 2 }}
            aria-label="voltar para o dashboard"
          >
            <ArrowBackIcon />
          </IconButton>
          
          <Typography variant="h4" component="h1">
            Diagnóstico da API
          </Typography>
          
          <IconButton 
            sx={{ ml: 'auto' }} 
            onClick={checkAllServices}
            disabled={loading}
            aria-label="atualizar status"
          >
            <RefreshIcon />
          </IconButton>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        <Card sx={{ mb: 4 }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <CableIcon sx={{ mr: 1 }} color="primary" />
              <Typography variant="h6">
                Status dos Serviços
              </Typography>
              
              {lastChecked && (
                <Typography variant="caption" sx={{ ml: 'auto' }}>
                  Última verificação: {new Date(lastChecked).toLocaleTimeString()}
                </Typography>
              )}
            </Box>
            
            <Divider sx={{ mb: 2 }} />
            
            {loading && services.every(s => s.status === 'pending') ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
                <CircularProgress />
              </Box>
            ) : (
              <List>
                {services.map((service) => (
                  <ListItem key={service.id} divider>
                    <ListItemIcon>
                      {getStatusIcon(service.status)}
                    </ListItemIcon>
                    <ListItemText 
                      primary={service.name} 
                      secondary={`Endpoint: ${service.endpoint}`}
                    />
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      {service.responseTime && (
                        <Typography variant="caption" sx={{ mr: 2, color: 'text.secondary' }}>
                          {service.responseTime}ms
                        </Typography>
                      )}
                      {getStatusChip(service.status)}
                    </Box>
                  </ListItem>
                ))}
              </List>
            )}
          </CardContent>
        </Card>

        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <Paper elevation={2} sx={{ p: 3, flex: '1 1 300px' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <CodeIcon sx={{ mr: 1 }} color="primary" />
              <Typography variant="h6">
                API Helper
              </Typography>
            </Box>
            
            <Divider sx={{ mb: 2 }} />
            
            <Typography variant="body2" paragraph>
              Se você encontrar problemas com algum serviço, considere:
            </Typography>
            
            <List sx={{ listStyleType: 'disc', pl: 2 }} dense>
              <ListItem sx={{ display: 'list-item' }}>
                <Typography variant="body2">
                  Verificar as credenciais de acesso
                </Typography>
              </ListItem>
              <ListItem sx={{ display: 'list-item' }}>
                <Typography variant="body2">
                  Confirmar que os serviços do backend estão em execução
                </Typography>
              </ListItem>
              <ListItem sx={{ display: 'list-item' }}>
                <Typography variant="body2">
                  Checar a conexão de rede
                </Typography>
              </ListItem>
            </List>
            
            <Button 
              variant="outlined" 
              fullWidth 
              sx={{ mt: 2 }}
              startIcon={<RefreshIcon />}
              onClick={checkAllServices}
            >
              Verificar Novamente
            </Button>
          </Paper>

          <Paper elevation={2} sx={{ p: 3, flex: '1 1 300px' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <StorageIcon sx={{ mr: 1 }} color="primary" />
              <Typography variant="h6">
                Informações do Sistema
              </Typography>
            </Box>
            
            <Divider sx={{ mb: 2 }} />
            
            <List dense>
              <ListItem>
                <ListItemText 
                  primary="Versão da API" 
                  secondary="v1.0.0"
                />
              </ListItem>
              
              <ListItem>
                <ListItemText 
                  primary="Ambiente" 
                  secondary="Desenvolvimento"
                />
              </ListItem>
              
              <ListItem>
                <ListItemText 
                  primary="Base URL" 
                  secondary="http://localhost:3000/api"
                />
              </ListItem>
              
              <ListItem>
                <ListItemText 
                  primary="Status da Base de Dados" 
                  secondary="Conectado"
                />
              </ListItem>
            </List>
          </Paper>
        </Box>
      </Container>
    </motion.div>
  );
};

export default ApiDiagnostic; 