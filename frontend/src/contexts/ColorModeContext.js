import React, { createContext, useState, useContext, useMemo, useEffect } from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';

// Cria o contexto para gerenciar o modo de cor
const ColorModeContext = createContext({
  toggleColorMode: () => {},
  mode: 'light',
});

// Hook personalizado para utilizar o contexto
export const useColorMode = () => useContext(ColorModeContext);

// Componente Provider para o contexto
export const ColorModeProvider = ({ children }) => {
  // Recuperar preferência do usuário do localStorage, ou usar 'light' como padrão
  const storedMode = localStorage.getItem('colorMode');
  const [mode, setMode] = useState(storedMode || 'light');

  // Função para alternar entre os modos
  const toggleColorMode = () => {
    setMode((prevMode) => {
      const newMode = prevMode === 'light' ? 'dark' : 'light';
      localStorage.setItem('colorMode', newMode);
      return newMode;
    });
  };

  // Verificar preferência do sistema operacional na primeira renderização
  useEffect(() => {
    if (!storedMode) {
      // Verificar preferência do sistema
      const prefersDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
      const initialMode = prefersDarkMode ? 'dark' : 'light';
      setMode(initialMode);
      localStorage.setItem('colorMode', initialMode);
    }
  }, [storedMode]);

  // Criar o tema com base no modo atual
  const theme = useMemo(() => 
    createTheme({
      palette: {
        mode,
        ...(mode === 'light'
          ? {
              // Paleta para modo claro
              primary: {
                main: '#304FFE',
                light: '#536DFE',
                dark: '#1A237E',
              },
              secondary: {
                main: '#651FFF',
                light: '#7C4DFF',
                dark: '#4A148C',
              },
              background: {
                default: '#f5f7fa',
                paper: '#ffffff',
              },
            }
          : {
              // Paleta para modo escuro
              primary: {
                main: '#536DFE',
                light: '#8C9EFF',
                dark: '#3D5AFE',
              },
              secondary: {
                main: '#7C4DFF',
                light: '#B388FF',
                dark: '#651FFF',
              },
              background: {
                default: '#1a1a2e',
                paper: '#16162c',
              },
            }),
      },
      typography: {
        fontFamily: [
          'Inter',
          'Roboto',
          '"Helvetica Neue"',
          'Arial',
          'sans-serif',
        ].join(','),
      },
      shape: {
        borderRadius: 8,
      },
      components: {
        MuiButton: {
          styleOverrides: {
            root: {
              textTransform: 'none',
              fontWeight: 500,
            },
          },
        },
      },
    }), 
    [mode]
  );

  // Valores do contexto
  const colorMode = useMemo(
    () => ({
      toggleColorMode,
      mode,
    }),
    [mode]
  );

  return (
    <ColorModeContext.Provider value={colorMode}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </ColorModeContext.Provider>
  );
};

export default ColorModeContext; 