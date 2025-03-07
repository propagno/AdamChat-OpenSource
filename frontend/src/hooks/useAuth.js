import { useState, useEffect, useCallback, useContext } from 'react';
import { AuthContext } from '../contexts/AuthContext';
import authApi from '../api/auth.api';
import { STORAGE_KEYS } from '../config/app.config';

/**
 * Hook personalizado para acessar o contexto de autenticação
 * @returns {Object} Contexto de autenticação com dados do usuário e métodos de autenticação
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  
  return context;
};

/**
 * Provider de autenticação
 * Gerencia estado de autenticação global
 */
export const useAuthProvider = () => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Função para verificar autenticação atual
  const checkAuth = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Verificar se existem tokens no armazenamento local
      const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
      
      if (!token) {
        setIsAuthenticated(false);
        setUser(null);
        setIsLoading(false);
        return false;
      }
      
      // Verificar se o token é válido no servidor
      const response = await authApi.validateToken();
      
      if (response.status === 200) {
        // Obter informações atualizadas do usuário
        const userResponse = await authApi.getUserInfo();
        setUser(userResponse.data);
        setIsAuthenticated(true);
        
        // Atualizar informações de usuário no localStorage
        localStorage.setItem(STORAGE_KEYS.USER_INFO, JSON.stringify(userResponse.data));
        
        return true;
      } else {
        // Token inválido
        handleLogout();
        return false;
      }
    } catch (err) {
      console.error('Erro ao verificar autenticação:', err);
      setError(err);
      handleLogout();
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  // Função para realizar login
  const handleLogin = useCallback(async (email, password) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await authApi.login(email, password);
      
      if (response.data.user) {
        setUser(response.data.user);
        setIsAuthenticated(true);
        return { success: true, user: response.data.user };
      } else {
        throw new Error('Resposta de login não contém dados do usuário');
      }
    } catch (err) {
      setError(err);
      return { 
        success: false, 
        error: err.message || 'Falha na autenticação'
      };
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  // Função para realizar logout
  const handleLogout = useCallback(async () => {
    setIsLoading(true);
    
    try {
      await authApi.logout();
    } catch (err) {
      console.warn('Erro ao fazer logout no servidor:', err);
    } finally {
      // Limpar estado local e armazenamento, independente da resposta do servidor
      setUser(null);
      setIsAuthenticated(false);
      localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
      localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
      localStorage.removeItem(STORAGE_KEYS.USER_INFO);
      setIsLoading(false);
    }
  }, []);
  
  // Função para registrar novo usuário
  const handleRegister = useCallback(async (userData) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await authApi.register(userData);
      return { 
        success: true, 
        message: 'Usuário registrado com sucesso', 
        data: response.data 
      };
    } catch (err) {
      setError(err);
      return { 
        success: false, 
        error: err.message || 'Falha no registro'
      };
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  // Inicialização - verificar autenticação quando o componente é montado
  useEffect(() => {
    const initAuth = async () => {
      await checkAuth();
    };
    
    initAuth();
    
    // Adicionar listener para eventos de armazenamento (para sincronizar entre abas)
    const handleStorageChange = (e) => {
      if (e.key === STORAGE_KEYS.AUTH_TOKEN && !e.newValue) {
        // Token foi removido em outra aba
        setUser(null);
        setIsAuthenticated(false);
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [checkAuth]);
  
  // Retornar o estado e métodos de autenticação
  return {
    user,
    isAuthenticated,
    isLoading,
    error,
    login: handleLogin,
    logout: handleLogout,
    register: handleRegister,
    checkAuth,
  };
};

export default useAuth; 