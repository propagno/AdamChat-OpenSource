import apiClient, { STORAGE_KEYS, checkApiHealth } from './api.client';
import { jwtDecode } from 'jwt-decode';
import { setLocalStorageItem, removeLocalStorageItem, getLocalStorageItem, diagnoseLocalStorage } from '../utils/storage';

/**
 * Serviço de API para autenticação
 * Este serviço fornece métodos para interagir com a API de autenticação do backend
 */
const authService = {
  /**
   * Verifica o status do sistema de autenticação
   * @returns {Promise} Objeto com informações de status
   */
  checkStatus: async () => {
    try {
      const response = await apiClient.get('/api/auth/status');
      return response.data;
    } catch (error) {
      console.error('Erro ao verificar status:', error);
      // Verificar se é um problema de conectividade
      if (error.message.includes('Network Error')) {
        return {
          status: 'error',
          message: 'Não foi possível conectar ao servidor. Verifique sua conexão e tente novamente.'
        };
      }
      throw error;
    }
  },

  /**
   * Verifica a validade do token atual
   * @returns {Promise} Resultado da validação
   */
  validateToken: async () => {
    try {
      // Verificar se existe um token
      const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
      if (!token) {
        return { valid: false, message: 'Nenhum token encontrado' };
      }
      
      // Tentar decodificar o token
      const decoded = authService.decodeJwt(token);
      
      // Se conseguiu decodificar e tem campos básicos esperados
      if (decoded && decoded.exp) {
        // Verificar se o token expirou
        const currentTime = Math.floor(Date.now() / 1000);
        if (decoded.exp < currentTime) {
          console.log('Token expirado:', decoded.exp, 'Current time:', currentTime);
          return { valid: false, message: 'Token expirado' };
        }
        
        // Token válido
        return { valid: true, user: decoded };
      }
      
      // Se não conseguiu decodificar como JWT, considerar válido se existir (confiando no localStorage)
      if (token) {
        console.log('Token encontrado mas não é JWT, assumindo válido');
        return { valid: true };
      }
      
      return { valid: false, message: 'Token inválido' };
    } catch (error) {
      console.error('Erro ao validar token:', error);
      if (error.message.includes('Network Error')) {
        return {
          valid: false,
          message: 'Não foi possível validar o token devido a problemas de conexão.'
        };
      }
      
      // Em caso de erro, confiar no token existente
      const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
      if (token) {
        console.warn('Erro ao validar token, mas existe um token. Assumindo válido:', error.message);
        return { valid: true };
      }
      
      return { valid: false, message: 'Erro ao validar token: ' + error.message };
    }
  },

  /**
   * Analisa e normaliza a resposta da API de login para diferentes formatos
   * @param {Object} response - Resposta da API de login
   * @returns {Object} Resposta normalizada com token e user
   */
  _normalizeLoginResponse: (response) => {
    console.log('Normalizando resposta de login:', response);
    
    if (!response) {
      throw new Error('Resposta vazia da API de login');
    }
    
    // Debug completo da estrutura da resposta
    console.log('Estrutura completa da resposta:', JSON.stringify(response, null, 2));
    
    // Estrutura onde podem estar os dados
    const data = response.data || response;
    
    // Formato específico da API - tokens dentro do objeto tokens
    if (data.tokens && data.tokens.access_token) {
      console.log('Detectado formato específico: tokens dentro do objeto tokens');
      return {
        accessToken: data.tokens.access_token,
        refreshToken: data.tokens.refresh_token || '',
        user: data.user || {}
      };
    }
    
    // Encontrar o token em diferentes formatos possíveis
    let accessToken = 
      data.access_token || 
      data.accessToken || 
      data.token || 
      data.id_token ||
      data.idToken ||
      data.auth_token ||
      data.authToken ||
      (data.tokens && data.tokens.access) || 
      (data.data && data.data.access_token) ||
      (data.data && data.data.token) ||
      null;
    
    // Verificar se o token está em um nível mais profundo da resposta
    if (!accessToken && typeof data === 'object') {
      // Procurar em todas as propriedades de primeiro nível
      Object.keys(data).forEach(key => {
        const value = data[key];
        if (typeof value === 'object' && value !== null) {
          // Verificar propriedades comuns de token em subobjetos
          accessToken = accessToken || 
            value.access_token || 
            value.accessToken || 
            value.token ||
            value.id_token ||
            value.idToken;
        }
      });
    }
    
    // Encontrar o refresh token em diferentes formatos
    const refreshToken = 
      data.refresh_token || 
      data.refreshToken || 
      (data.tokens && data.tokens.refresh) || 
      (data.data && data.data.refresh_token) ||
      '';
    
    // Encontrar os dados do usuário em diferentes formatos
    let user = 
      data.user || 
      data.userData || 
      data.usuario ||
      data.userInfo ||
      data.profile ||
      (data.data && data.data.user) ||
      null;
    
    // Se não encontramos o usuário, mas temos dados de usuário na raiz
    if (!user && data.email) {
      // Tentar construir um objeto de usuário a partir de campos individuais
      user = {
        email: data.email,
        id: data.id || data.userId || 'unknown',
        name: data.name || data.nome || data.username || data.email
      };
    }
    
    // Em desenvolvimento, permitir login mesmo sem token
    const isDevelopment = process.env.NODE_ENV === 'development' || window.location.hostname === 'localhost';
    
    if (!accessToken && isDevelopment) {
      console.warn('DESENVOLVIMENTO: Token não encontrado, mas gerando token para teste');
      // Gerar um token falso para testes de desenvolvimento
      accessToken = 'dev-token-' + Math.random().toString(36).substring(2);
      
      // Se não temos dados de usuário, criar um objeto mínimo
      if (!user) {
        user = { id: 'dev-user', email: 'dev@example.com', name: 'Usuário de Teste' };
      }
    } else if (!accessToken) {
      // Em produção, exibir erro detalhado sobre a estrutura da resposta
      console.error('Token não encontrado na resposta. Estrutura completa:', data);
      throw new Error('Token de acesso não encontrado na resposta da API. Verifique o formato da resposta.');
    }
    
    // Se ainda não temos usuário mas temos token, criar um objeto mínimo
    if (!user && accessToken) {
      user = { id: 'unknown', email: 'user@domain.com', name: 'Usuário' };
    }
    
    console.log('Dados normalizados:', { accessToken: accessToken ? '[PRESENTE]' : '[AUSENTE]', user });
    
    // Retornar dados normalizados
    return {
      accessToken,
      refreshToken,
      user
    };
  },

  /**
   * Realiza login do usuário
   * @param {string} email - Email do usuário
   * @param {string} password - Senha do usuário
   * @returns {Promise} Resultado do login
   */
  login: async (email, password) => {
    try {
      console.log('Tentando fazer login com:', { email });
      
      // Diagnosticar estado inicial do localStorage
      console.log('Estado do localStorage antes do login:');
      diagnoseLocalStorage([
        STORAGE_KEYS.ACCESS_TOKEN, 
        STORAGE_KEYS.AUTH_TOKEN,
        STORAGE_KEYS.REFRESH_TOKEN, 
        STORAGE_KEYS.USER_DATA,
        STORAGE_KEYS.USER_INFO
      ]);
      
      // Usar apenas o endpoint principal com conexão direta
      const response = await apiClient.post('/api/auth/login', { 
        email, 
        password 
      });
      
      console.log('Resposta do login recebida:', response.data);
      
      // Verificar se há erros na resposta
      if (response.data.status === 'error' || response.data.error) {
        console.error('Erro retornado pelo servidor:', response.data);
        throw new Error(response.data.message || 'Erro ao efetuar login');
      }
      
      // Estruturas possíveis da resposta:
      // 1. { access_token, refresh_token, ... }
      // 2. { data: { access_token, refresh_token, ... } }
      // 3. { tokens: { access_token, refresh_token, ... } }
      // 4. { token: access_token, refresh_token, ... }
      
      // Extrair tokens através de várias verificações
      let access_token, refresh_token, userData;
      
      // Verificar estrutura direta
      if (response.data.access_token) {
        access_token = response.data.access_token;
        refresh_token = response.data.refresh_token;
        userData = response.data.user || response.data.userData;
      } 
      // Verificar dentro de data 
      else if (response.data.data && response.data.data.access_token) {
        access_token = response.data.data.access_token;
        refresh_token = response.data.data.refresh_token;
        userData = response.data.data.user || response.data.data.userData;
      } 
      // Verificar dentro de tokens
      else if (response.data.tokens) {
        access_token = response.data.tokens.access_token;
        refresh_token = response.data.tokens.refresh_token;
        userData = response.data.user || response.data.userData;
      }
      // Verificar token único
      else if (response.data.token) {
        access_token = response.data.token;
        refresh_token = response.data.refresh_token;
        userData = response.data.user || response.data.userData;
      }
      
      // Verificar se conseguimos extrair um token de acesso
      if (!access_token) {
        console.error('Token não encontrado na resposta:', response.data);
        
        // Debugar a estrutura da resposta
        console.log('Estrutura da resposta:', JSON.stringify(response.data, null, 2));
        console.log('Chaves da resposta:', Object.keys(response.data));
        
        // Em ambiente de desenvolvimento, podemos usar um token falso para testes
        if (process.env.NODE_ENV === 'development' && response.data.status === 'success') {
          console.warn('DESENVOLVIMENTO: Usando token falso para testes');
          // Token JWT falso para testes em desenvolvimento
          access_token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJkZXYtdXNlciIsImVtYWlsIjoidGVzdEBleGFtcGxlLmNvbSIsIm5hbWUiOiJVc3VhcmlvIGRlIFRlc3RlIiwicm9sZXMiOlsidXNlciJdLCJleHAiOjQ3Njc2NzYwMDB9.IoBuKDPxgplxw6ylxbcI6QvZ9pqGQm5vNWQxIHE8lbE';
          refresh_token = 'dev-refresh-token';
        } else {
          throw new Error('Autenticação falhou: token não encontrado na resposta');
        }
      }
      
      // Armazenar tokens usando os serviços padronizados
      setLocalStorageItem(STORAGE_KEYS.ACCESS_TOKEN, access_token);
      
      if (refresh_token) {
        setLocalStorageItem(STORAGE_KEYS.REFRESH_TOKEN, refresh_token);
      }
      
      console.log('Tokens armazenados com sucesso');
      
      // Obter informações do usuário do token
      const decoded = authService.decodeJwt(access_token);
      
      // Usar dados do usuário da resposta ou do token decodificado
      const userInfo = userData || (decoded ? {
        id: decoded.sub,
        email: decoded.email || email,
        name: decoded.name || email.split('@')[0],
        roles: decoded.roles || ['user']
      } : {
        email: email,
        name: email.split('@')[0]
      });
      
      // Armazenar informações do usuário
      setLocalStorageItem(STORAGE_KEYS.USER_DATA, userInfo);
      console.log('Informações do usuário armazenadas:', userInfo);
      
      // Diagnosticar estado final do localStorage
      console.log('Estado do localStorage após login:');
      diagnoseLocalStorage([
        STORAGE_KEYS.ACCESS_TOKEN, 
        STORAGE_KEYS.AUTH_TOKEN,
        STORAGE_KEYS.REFRESH_TOKEN, 
        STORAGE_KEYS.USER_DATA,
        STORAGE_KEYS.USER_INFO
      ]);
      
      // Retornar os dados do usuário
      return userInfo;
    } catch (error) {
      console.error('Erro ao realizar login:', error);
      
      // Limpar qualquer estado de autenticação parcial
      authService.clearAuthState();
      
      // Tratar erros específicos
      if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
        throw new Error('O servidor demorou muito para responder. Tente novamente mais tarde.');
      }
      
      if (error.message && error.message.includes('Network Error')) {
        throw new Error('Não foi possível conectar ao servidor. Verifique se o servidor backend está rodando.');
      }
      
      // Se tiver resposta do servidor, mostrar mensagem específica
      if (error.response) {
        const status = error.response.status;
        
        if (status === 401 || status === 403) {
          throw new Error('Credenciais inválidas. Verifique seu email e senha.');
        } else if (status === 404) {
          throw new Error('Serviço de autenticação não encontrado. Verifique se a URL da API está correta.');
        } else if (status === 429) {
          throw new Error('Muitas tentativas de login. Tente novamente mais tarde.');
        } else if (status >= 500) {
          throw new Error('Erro no servidor. Tente novamente mais tarde.');
        }
      }
      
      // Erro genérico
      throw new Error(error.message || 'Erro ao processar sua solicitação.');
    }
  },

  /**
   * Realiza o registro de um novo usuário
   * @param {Object} userData - Dados do usuário para registro
   * @returns {Promise} Resultado do registro
   */
  register: async (userData) => {
    try {
      // Remover verificação de saúde desnecessária
      console.log('Registrando novo usuário:', userData.email);
      
      const response = await apiClient.post('/api/auth/register', userData);
      return response.data;
    } catch (error) {
      console.error('Erro ao registrar usuário:', error);
      
      if (error.message && (error.message.includes('Network Error') || error.code === 'ERR_FAILED')) {
        throw new Error('Não foi possível conectar ao servidor. Verifique se o servidor backend está rodando.');
      }
      
      if (error.response) {
        const status = error.response.status;
        const data = error.response.data;
        
        if (status === 409) {
          throw new Error(data.message || 'Este email ou nome de usuário já está em uso.');
        } else if (status === 405) {
          throw new Error('Método não permitido. Verifique a configuração da API.');
        } else {
          throw new Error(data.message || 'Erro ao registrar usuário. Tente novamente.');
        }
      }
      
      throw error;
    }
  },

  /**
   * Solicita redefinição de senha
   * @param {string} email - Email do usuário
   * @returns {Promise} Resultado da solicitação
   */
  requestPasswordReset: async (email) => {
    try {
      console.log(`Solicitando redefinição de senha para o email: ${email}`);
      const response = await apiClient.post('/api/auth/forgot-password', { email });
      console.log('Resposta da solicitação de redefinição:', response.data);
      return response.data;
    } catch (error) {
      console.error('Erro ao solicitar redefinição de senha:', error);
      
      // Erro de conexão
      if (error.message && error.message.includes('Network Error')) {
        throw new Error('Não foi possível conectar ao servidor. Verifique sua conexão e tente novamente.');
      }
      
      // Erro de resposta da API
      if (error.response) {
        const status = error.response.status;
        const errorData = error.response.data;
        
        console.log(`Erro ${status} na solicitação de redefinição:`, errorData);
        
        // Tratamento específico por código de status
        if (status === 404) {
          throw new Error('Serviço de redefinição de senha não disponível. Entre em contato com o suporte.');
        } else if (status === 400) {
          throw new Error(errorData.message || 'Email inválido ou mal formatado.');
        } else if (status === 429) {
          throw new Error('Muitas tentativas. Tente novamente mais tarde.');
        }
        
        // Mensagem padrão para outros erros
        throw new Error(errorData.message || 'Erro ao processar sua solicitação.');
      }
      
      // Erro genérico
      throw new Error('Ocorreu um erro inesperado. Tente novamente mais tarde.');
    }
  },

  /**
   * Redefine a senha do usuário
   * @param {string} token - Token de redefinição
   * @param {string} password - Nova senha
   * @returns {Promise} Resultado da redefinição
   */
  resetPassword: async (token, password) => {
    try {
      const response = await apiClient.post('/api/auth/reset-password', { token, password });
      return response.data;
    } catch (error) {
      console.error('Erro ao redefinir senha:', error);
      
      if (error.message.includes('Network Error')) {
        throw new Error('Não foi possível conectar ao servidor. Verifique sua conexão e tente novamente.');
      }
      
      if (error.response) {
        throw new Error(error.response.data.message || 'Erro ao redefinir sua senha. O token pode ser inválido ou ter expirado.');
      }
      
      throw error;
    }
  },

  /**
   * Realiza o logout do usuário
   * Remove tokens e informações do usuário do armazenamento local
   */
  logout: () => {
    removeLocalStorageItem(STORAGE_KEYS.ACCESS_TOKEN);
    removeLocalStorageItem(STORAGE_KEYS.REFRESH_TOKEN);
    removeLocalStorageItem(STORAGE_KEYS.USER_DATA);
    
    // Limpar outras informações de sessão, se houver
    console.log('Tokens e dados de usuário removidos');
  },

  /**
   * Obtém o token de acesso atual
   * @returns {string|null} Token de acesso ou null
   */
  getToken: () => {
    return localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
  },

  /**
   * Verifica se o usuário está logado
   * @returns {boolean} true se estiver logado, false caso contrário
   */
  isLoggedIn: () => {
    // Tentar com as duas chaves possíveis para maior compatibilidade
    const token = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN) || 
                  localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
    
    const isLoggedIn = !!token;
    console.log(`Verificando se usuário está logado: ${isLoggedIn ? 'SIM' : 'NÃO'}`);
    
    if (!isLoggedIn) {
      console.log('Chaves verificadas:', {
        ACCESS_TOKEN: STORAGE_KEYS.ACCESS_TOKEN,
        AUTH_TOKEN: STORAGE_KEYS.AUTH_TOKEN
      });
      console.log('Diagnóstico de localStorage:');
      diagnoseLocalStorage();
    }
    
    return isLoggedIn;
  },

  /**
   * Retorna o usuário atual do armazenamento local
   * @returns {Object|null} Informações do usuário ou null
   */
  getCurrentUser: () => {
    try {
      const userJson = localStorage.getItem(STORAGE_KEYS.USER_DATA);
      if (userJson) {
        return JSON.parse(userJson);
      }
      return null;
    } catch (error) {
      console.error('Erro ao obter dados do usuário:', error);
      return null;
    }
  },
  
  /**
   * Atualiza o token de acesso usando o token de atualização
   * @returns {Promise} Resultado da atualização do token
   */
  refreshToken: async () => {
    try {
      const refreshToken = localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
      
      if (!refreshToken) {
        throw new Error('Nenhum token de atualização disponível');
      }
      
      const response = await apiClient.post('/auth/refresh-token', { refresh_token: refreshToken });
      
      if (response.data && response.data.access_token) {
        localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, response.data.access_token);
        
        if (response.data.refresh_token) {
          localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, response.data.refresh_token);
        }
      }
      
      return response.data;
    } catch (error) {
      console.error('Erro ao atualizar token:', error);
      throw error;
    }
  },

  /**
   * Obtém informações do usuário atual
   * @returns {Promise} Dados do usuário
   */
  getUserInfo: async () => {
    try {
      const response = await apiClient.get('/auth/user');
      return response.data;
    } catch (error) {
      console.error('Erro ao obter informações do usuário:', error);
      throw error;
    }
  },

  /**
   * Atualiza as informações do perfil do usuário
   * @param {Object} userData - Dados atualizados do usuário
   * @returns {Promise} Dados atualizados do usuário
   */
  updateProfile: async (userData) => {
    try {
      const response = await apiClient.put('/auth/update-profile', userData);
      
      // Atualizar informações do usuário no armazenamento local
      if (response.data && response.data.user) {
        localStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(response.data.user));
      }
      
      return response.data;
    } catch (error) {
      console.error('Erro ao atualizar perfil:', error);
      throw error;
    }
  },
  
  /**
   * Exclui a conta do usuário
   * @returns {Promise} Resultado da exclusão
   */
  deleteAccount: async () => {
    try {
      const response = await apiClient.delete('/auth/delete-account');
      
      // Remover tokens e informações do usuário do armazenamento local
      localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
      localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
      localStorage.removeItem(STORAGE_KEYS.USER_DATA);
      
      return response.data;
    } catch (error) {
      console.error('Erro ao excluir conta:', error);
      throw error;
    }
  },

  /**
   * Limpa todos os dados de autenticação do armazenamento local
   */
  clearAuthState: () => {
    console.log('Estado de autenticação limpo completamente');
    removeLocalStorageItem(STORAGE_KEYS.ACCESS_TOKEN);
    removeLocalStorageItem(STORAGE_KEYS.REFRESH_TOKEN);
    removeLocalStorageItem(STORAGE_KEYS.USER_DATA);
    
    // Log para debugging
    console.log('🐞 [LOGIN DEBUG] ' + new Date().toISOString() + ' - auth_state_cleared', {});
  },

  /**
   * Decodifica um token JWT
   * @param {string} token - Token JWT para decodificar
   * @returns {Object|null} Token decodificado ou null
   */
  decodeJwt: (token) => {
    try {
      if (!token) return null;
      // Usar biblioteca importada para decodificação
      return jwtDecode(token);
    } catch (error) {
      console.error('Erro ao decodificar token:', error);
      return null;
    }
  },

  // Processar callback de autenticação OAuth
  processOAuthCallback: () => {
    try {
      // Verificar se há parâmetros de autenticação OAuth na URL
      const urlParams = new URLSearchParams(window.location.search);
      const accessToken = urlParams.get('access_token');
      const refreshToken = urlParams.get('refresh_token');
      const error = urlParams.get('error');
      const errorDescription = urlParams.get('error_description');

      // Se houver erro, retornar detalhes
      if (error) {
        return {
          success: false,
          error: error,
          message: errorDescription || 'Erro na autenticação social.'
        };
      }

      // Se houver tokens, armazenar e retornar sucesso
      if (accessToken && refreshToken) {
        // Armazenar tokens no localStorage ou sessionStorage
        localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, accessToken);
        localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refreshToken);

        // Decodificar token para obter informações do usuário
        const user = authService.decodeJwt(accessToken);
        
        // Armazenar informações do usuário
        if (user) {
          localStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify({
            id: user.sub,
            email: user.email,
            name: user.name || user.email.split('@')[0],
            roles: user.roles || ['user']
          }));
        }

        // Limpar parâmetros da URL (opcional)
        window.history.replaceState({}, document.title, window.location.pathname);

        return {
          success: true,
          message: 'Autenticação social bem-sucedida.'
        };
      }

      return {
        success: false,
        message: 'Nenhum parâmetro de autenticação encontrado na URL.'
      };
    } catch (error) {
      console.error('Erro ao processar callback OAuth:', error);
      return {
        success: false,
        message: 'Erro ao processar autenticação social.'
      };
    }
  },
};

export default authService; 