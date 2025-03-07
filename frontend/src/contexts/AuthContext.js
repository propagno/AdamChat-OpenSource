import React, { createContext, useState, useEffect, useCallback, useContext } from 'react';
import authService from '../api/auth.service';
import { STORAGE_KEYS } from '../api/api.client';
import { diagnoseLocalStorage } from '../utils/storage';

// Criar o contexto de autenticação
export const AuthContext = createContext(null);

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
 * Gerencia estado de autenticação global da aplicação
 * 
 * @param {Object} props - Propriedades do componente
 * @param {React.ReactNode} props.children - Componentes filhos
 */
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Função para logout - movida para antes de checkAuth para evitar erros de referência
  const handleLogout = useCallback(() => {
    console.log('Fazendo logout');
    
    // Limpar tokens e informações do usuário
    authService.logout();
    
    // Resetar estado de autenticação
    setUser(null);
    setIsAuthenticated(false);
    
    return true;
  }, []);
  
  // Função para verificar autenticação atual
  const checkAuth = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      console.log('Verificando estado de autenticação...');
      diagnoseLocalStorage([
        STORAGE_KEYS.ACCESS_TOKEN,
        STORAGE_KEYS.AUTH_TOKEN,
        STORAGE_KEYS.USER_DATA,
        STORAGE_KEYS.USER_INFO
      ]);
      
      // Verificar se há token no armazenamento local
      const hasToken = authService.isLoggedIn();
      
      if (!hasToken) {
        console.log('Nenhum token encontrado. Usuário não está autenticado.');
        setIsAuthenticated(false);
        setUser(null);
        setIsLoading(false);
        return false;
      }
      
      // Se já estiver autenticado e tiver dados do usuário, não precisa verificar novamente
      if (isAuthenticated && user) {
        console.log('Usuário já está autenticado com dados:', user);
        setIsLoading(false);
        return true;
      }
      
      try {
        // Verificar se o token é válido localmente
        const tokenStatus = await authService.validateToken();
        console.log('Status da validação do token:', tokenStatus);
        
        if (!tokenStatus || !tokenStatus.valid) {
          console.log('Token inválido detectado');
          handleLogout();
          return false;
        }
        
        // Obter informações do usuário
        let currentUser = authService.getCurrentUser();
        
        // Se não tiver dados do usuário no localStorage, mas tiver no token
        if (!currentUser && tokenStatus.user) {
          console.log('Usando dados do usuário do token JWT');
          currentUser = tokenStatus.user;
          // Salvar no localStorage para uso futuro
          localStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(currentUser));
        }
        
        console.log('Usuário atual:', currentUser);
        
        // Se ainda não tiver dados do usuário, criar um objeto mínimo
        if (!currentUser) {
          console.log('Criando dados mínimos para o usuário');
          currentUser = { id: 'unknown', email: 'user@example.com' };
          localStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(currentUser));
        }
        
        setUser(currentUser);
        setIsAuthenticated(true);
        console.log('Usuário autenticado com sucesso');
        return true;
      } catch (err) {
        // Se for erro de rede, não fazer logout automaticamente
        if (err.message && err.message.includes('Network Error')) {
          console.error('Erro de rede ao verificar token:', err);
          // Assumir que o token é válido em caso de erro de rede
          const currentUser = authService.getCurrentUser();
          if (currentUser) {
            setUser(currentUser);
            setIsAuthenticated(true);
            setError({
              type: 'warning',
              message: 'Funcionando offline. Algumas funcionalidades podem estar limitadas.'
            });
            return true;
          }
        }
        
        console.error('Erro ao verificar token:', err);
        
        // Em ambiente de desenvolvimento, considerar válido mesmo com erro
        if (process.env.NODE_ENV === 'development' || window.location.hostname === 'localhost') {
          console.warn('DESENVOLVIMENTO: Ignorando erro de verificação de token e assumindo autenticado');
          const currentUser = authService.getCurrentUser() || { id: 'dev-user', email: 'dev@example.com' };
          setUser(currentUser);
          setIsAuthenticated(true);
          return true;
        }
        
        handleLogout();
        return false;
      }
    } catch (err) {
      console.error('Erro ao verificar autenticação:', err);
      setError(err);
      
      // Em ambiente de desenvolvimento, considerar válido mesmo com erro
      if (process.env.NODE_ENV === 'development' || window.location.hostname === 'localhost') {
        console.warn('DESENVOLVIMENTO: Ignorando erro de autenticação e assumindo autenticado');
        return true;
      }
      
      handleLogout();
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [handleLogout, isAuthenticated, user]);
  
  // Função para realizar login
  const handleLogin = useCallback(async (email, password) => {
    setIsLoading(true);
    setError(null);
    
    try {
      console.log('Tentando fazer login:', email);
      
      // Chamar o serviço de autenticação
      const response = await authService.login(email, password);
      
      // Verificação robusta do objeto de resposta
      if (!response) {
        throw new Error('Resposta de login vazia');
      }
      
      console.log('Login concluído, resposta:', response);
      
      // Verificar imediatamente se o token foi armazenado corretamente
      const tokenSalvo = authService.getToken();
      
      if (!tokenSalvo) {
        console.error('Token não foi armazenado corretamente após o login');
        throw new Error('Falha ao armazenar o token de autenticação');
      }
      
      // Identificar o objeto user na resposta (pode estar em diferentes formatos)
      const userData = response.user || response.userData || response;
      
      // Verificar se temos dados de usuário válidos
      if (!userData || typeof userData !== 'object') {
        console.error('Dados de usuário inválidos:', userData);
        // Tentar extrair dados do token
        const tokenData = authService.decodeJwt(tokenSalvo);
        if (tokenData) {
          console.log('Extraindo informações de usuário do token JWT:', tokenData);
          setUser(tokenData);
        } else {
          // Criar objeto de usuário mínimo
          setUser({ id: 'unknown', email });
        }
      } else {
        console.log('Login bem-sucedido, dados do usuário:', userData);
        setUser(userData);
      }
      
      // Definir autenticado imediatamente após login bem-sucedido
      setIsAuthenticated(true);
      
      // Retornar sucesso para o componente de login
      return true;
    } catch (err) {
      console.error('Erro no login:', err);
      setError(err);
      setIsAuthenticated(false);
      
      // Limpar qualquer dado parcial que possa ter sido armazenado
      authService.clearAuthState();
      
      // Propagar o erro para ser tratado pelo componente
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  // Função para registro de usuário
  const handleRegister = useCallback(async (userData) => {
    setIsLoading(true);
    setError(null);
    
    try {
      console.log('Registrando novo usuário:', userData.email);
      
      // Chamar o serviço de registro
      const response = await authService.register(userData);
      
      console.log('Usuário registrado com sucesso:', response);
      
      return { 
        success: true, 
        message: 'Conta criada com sucesso!' 
      };
    } catch (err) {
      console.error('Erro no registro:', err);
      setError(err);
      
      return { 
        success: false, 
        message: err.response?.data?.message || err.message || 'Erro ao registrar usuário'
      };
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  // Verificar autenticação ao montar
  useEffect(() => {
    console.log('Verificando autenticação inicial');
    checkAuth();
  }, [checkAuth]);
  
  // Valor do contexto
  const value = {
    user,
    setUser,
    isAuthenticated,
    setIsAuthenticated,
    isLoading,
    error,
    login: handleLogin,
    logout: handleLogout,
    register: handleRegister,
    checkAuth
  };
  
  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider; 