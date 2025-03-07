import React from 'react';
import { Box, Container, Paper, Typography, CssBaseline, ThemeProvider } from '@mui/material';
import { Helmet } from 'react-helmet';
import { ErrorBoundary } from 'react-error-boundary';
import ErrorFallback from '../components/common/ErrorFallback';
import { lightTheme } from '../theme';

/**
 * Layout para páginas de autenticação (login, registro, recuperação de senha)
 * 
 * @param {Object} props - Propriedades do componente
 * @param {React.ReactNode} props.children - Conteúdo da página
 * @param {string} props.title - Título da página
 * @param {string} props.description - Descrição para SEO
 * @param {string} props.headerText - Texto do cabeçalho
 * @param {string} props.subHeaderText - Texto secundário do cabeçalho
 */
const AuthLayout = ({ 
  children, 
  title = 'AdamChat - Autenticação',
  description = 'Acesse sua conta na plataforma AdamChat',
  headerText = 'Bem-vindo ao AdamChat',
  subHeaderText = 'Faça login para acessar todas as funcionalidades'
}) => {
  return (
    <ThemeProvider theme={lightTheme}>
      <CssBaseline />
      <Helmet>
        <title>{title}</title>
        <meta name="description" content={description} />
        <meta name="theme-color" content={lightTheme.palette.primary.main} />
      </Helmet>
      
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: 'background.default',
          py: 4,
          px: 2,
        }}
      >
        <Container maxWidth="sm">
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              mb: 4,
            }}
          >
            <Typography variant="h4" component="h1" gutterBottom>
              {headerText}
            </Typography>
            <Typography variant="subtitle1" color="text.secondary" align="center" gutterBottom>
              {subHeaderText}
            </Typography>
          </Box>
          
          <Paper
            elevation={3}
            sx={{
              px: { xs: 3, sm: 6 },
              py: { xs: 4, sm: 6 },
              borderRadius: 2,
            }}
          >
            <ErrorBoundary
              FallbackComponent={ErrorFallback}
              onReset={() => window.location.reload()}
            >
              {children}
            </ErrorBoundary>
          </Paper>
          
          <Box
            sx={{
              mt: 4,
              textAlign: 'center',
            }}
          >
            <Typography variant="body2" color="text.secondary">
              &copy; {new Date().getFullYear()} AdamChat. Todos os direitos reservados.
            </Typography>
          </Box>
        </Container>
      </Box>
    </ThemeProvider>
  );
};

export default AuthLayout; 