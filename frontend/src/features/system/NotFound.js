import React from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { Box, Button, Typography, Container, Paper } from '@mui/material';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import HomeIcon from '@mui/icons-material/Home';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useAuth } from '../../hooks/useAuth';

/**
 * Página 404 - Not Found
 * Exibida quando o usuário tenta acessar uma rota inexistente
 */
const NotFound = () => {
  const { isAuthenticated } = useAuth();
  
  // Determinar para onde redirecionar o usuário ao clicar no botão Início
  const homePath = isAuthenticated ? '/app/dashboard' : '/login';
  
  return (
    <Container maxWidth="md">
      <Paper
        elevation={3}
        sx={{
          p: 4,
          mt: 8,
          mb: 4,
          borderRadius: 2,
          textAlign: 'center',
        }}
      >
        <ErrorOutlineIcon 
          color="error" 
          sx={{ fontSize: 80, mb: 2 }} 
        />
        
        <Typography variant="h3" component="h1" gutterBottom>
          404
        </Typography>
        
        <Typography variant="h5" component="h2" gutterBottom>
          Página não encontrada
        </Typography>
        
        <Typography variant="body1" color="text.secondary" paragraph>
          A página que você está tentando acessar não existe ou foi movida.
        </Typography>
        
        <Box
          sx={{
            mt: 4,
            display: 'flex',
            flexDirection: { xs: 'column', sm: 'row' },
            justifyContent: 'center',
            gap: 2,
          }}
        >
          <Button
            variant="contained"
            color="primary"
            startIcon={<HomeIcon />}
            component={RouterLink}
            to={homePath}
          >
            Ir para a página inicial
          </Button>
          
          <Button
            variant="outlined"
            startIcon={<ArrowBackIcon />}
            onClick={() => window.history.back()}
          >
            Voltar para a página anterior
          </Button>
        </Box>
      </Paper>
      
      <Box textAlign="center" mt={4}>
        <Typography variant="body2" color="text.secondary">
          Se você acredita que isso é um erro, entre em contato com o suporte.
        </Typography>
      </Box>
    </Container>
  );
};

export default NotFound; 