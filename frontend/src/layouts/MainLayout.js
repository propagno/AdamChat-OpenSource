import React, { useState, useEffect } from 'react';
import { Box, Container, CssBaseline, ThemeProvider, useMediaQuery } from '@mui/material';
import { Helmet } from 'react-helmet';
import Navbar from '../components/Navbar';
import { ErrorBoundary } from 'react-error-boundary';
import ErrorFallback from '../components/common/ErrorFallback';
import { getTheme } from '../theme';
import { STORAGE_KEYS } from '../config/app.config';

/**
 * Layout principal da aplicação
 * Contém a estrutura comum a todas as páginas autenticadas
 * 
 * @param {Object} props - Propriedades do componente
 * @param {React.ReactNode} props.children - Conteúdo da página
 * @param {string} props.title - Título da página
 * @param {string} props.description - Descrição para SEO
 * @param {boolean} props.fullWidth - Se o conteúdo deve ocupar toda a largura
 */
const MainLayout = ({ 
  children, 
  title = 'AdamChat', 
  description = 'Plataforma de IA para diversas funcionalidades', 
  fullWidth = false 
}) => {
  // Verificar preferência de tema do usuário
  const prefersDarkMode = useMediaQuery('(prefers-color-scheme: dark)');
  const [themeMode, setThemeMode] = useState('light');
  
  // Estado para notificação de modo offline
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  
  // Carregar preferência de tema do armazenamento local
  useEffect(() => {
    const savedTheme = localStorage.getItem(STORAGE_KEYS.THEME_PREFERENCE);
    
    if (savedTheme) {
      setThemeMode(savedTheme);
    } else {
      setThemeMode(prefersDarkMode ? 'dark' : 'light');
    }
  }, [prefersDarkMode]);
  
  // Monitorar estado da conexão
  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);
  
  // Alternar entre temas claro e escuro
  const toggleTheme = () => {
    const newTheme = themeMode === 'light' ? 'dark' : 'light';
    setThemeMode(newTheme);
    localStorage.setItem(STORAGE_KEYS.THEME_PREFERENCE, newTheme);
  };
  
  // Obter tema atual
  const theme = getTheme(themeMode);
  
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Helmet>
        <title>{title}</title>
        <meta name="description" content={description} />
        <meta name="theme-color" content={theme.palette.primary.main} />
      </Helmet>
      
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          minHeight: '100vh',
          bgcolor: 'background.default',
          color: 'text.primary',
        }}
      >
        <Navbar onThemeToggle={toggleTheme} currentTheme={themeMode} />
        
        {isOffline && (
          <Box
            sx={{
              py: 1,
              bgcolor: 'warning.main',
              color: 'warning.contrastText',
              textAlign: 'center',
              width: '100%',
            }}
          >
            Você está offline. Algumas funcionalidades podem não estar disponíveis.
          </Box>
        )}
        
        <Box
          component="main"
          sx={{
            flexGrow: 1,
            py: 4,
            width: '100%',
          }}
        >
          <ErrorBoundary
            FallbackComponent={ErrorFallback}
            onReset={() => window.location.reload()}
          >
            {fullWidth ? (
              <Box sx={{ px: { xs: 2, md: 4 } }}>
                {children}
              </Box>
            ) : (
              <Container maxWidth="lg">
                {children}
              </Container>
            )}
          </ErrorBoundary>
        </Box>
      </Box>
    </ThemeProvider>
  );
};

export default MainLayout; 