/**
 * Serviço de Autenticação
 * 
 * Fornece funcionalidades para:
 * - Gerenciamento de sessão
 * - Verificação de autenticação
 * - Recuperação de informações do usuário
 * - Transição para o modo de emergência
 */

import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
const AUTH_TOKEN_KEY = 'access_token';
const REFRESH_TOKEN_KEY = 'refresh_token';
const USER_INFO_KEY = 'user_info';

class AuthService {
  /**
   * Verifica o status do backend e do sistema de autenticação
   * Útil para diagnóstico e decisão de fallback para o modo de emergência
   */
  async checkAuthStatus() {
    try {
      // Verificar status do sistema de autenticação no backend
      const response = await axios.get(`${API_URL}/auth/status`);
      return response.data;
    } catch (error) {
      console.error('Erro ao verificar status da autenticação:', error);
      return {
        status: 'error',
        message: 'Não foi possível verificar o status da autenticação',
        emergency_mode: false
      };
    }
  }
  
  /**
   * Verifica se o usuário está autenticado diretamente com o backend
   * Útil para validar tokens e obter informações atualizadas do usuário
   */
  async validateAuthentication() {
    try {
      // Obter token atual
      const token = this.getToken();
      
      if (!token) {
        return { authenticated: false };
      }
      
      // Verificar token com o backend
      const response = await axios.get(`${API_URL}/auth/user`, {
        headers: this.getAuthHeader()
      });
      
      if (response.data.status === 'ok' && response.data.user) {
        return {
          authenticated: true,
          user: response.data.user
        };
      }
      
      return { authenticated: false };
    } catch (error) {
      console.error('Erro ao validar autenticação:', error);
      return { authenticated: false };
    }
  }
  
  /**
   * Obtém o token de autenticação armazenado
   */
  getToken() {
    return localStorage.getItem(AUTH_TOKEN_KEY);
  }
  
  /**
   * Obtém o token de atualização armazenado
   */
  getRefreshToken() {
    return localStorage.getItem(REFRESH_TOKEN_KEY);
  }
  
  /**
   * Obtém as informações do usuário armazenadas
   */
  getUserInfo() {
    const userInfoStr = localStorage.getItem(USER_INFO_KEY);
    
    if (userInfoStr) {
      try {
        return JSON.parse(userInfoStr);
      } catch (error) {
        console.error('Erro ao processar informações do usuário:', error);
        return null;
      }
    }
    
    return null;
  }
  
  /**
   * Verifica se o usuário possui uma determinada função
   */
  hasRole(role) {
    const userInfo = this.getUserInfo();
    return userInfo && 
           userInfo.roles && 
           Array.isArray(userInfo.roles) && 
           userInfo.roles.includes(role);
  }
  
  /**
   * Verifica se o usuário é administrador
   */
  isAdmin() {
    return this.hasRole('admin');
  }
  
  /**
   * Atualiza o token de autenticação
   */
  async refreshToken() {
    try {
      const refreshToken = this.getRefreshToken();
      
      if (!refreshToken) {
        return false;
      }
      
      // Tentar atualizar o token
      const response = await axios.post(`${API_URL}/auth/refresh-token`, { 
        refresh_token: refreshToken
      });
      
      if (response.data.status === 'success' && response.data.tokens) {
        // Armazenar novos tokens
        this.setSession(
          response.data.tokens.access_token,
          response.data.tokens.refresh_token,
          null // Manter as informações do usuário existentes
        );
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Erro ao atualizar token:', error);
      return false;
    }
  }
  
  /**
   * Realiza o login do usuário
   */
  async login(credentials) {
    try {
      // Adaptar formato de dados se necessário
      const loginData = {
        email: credentials.username || credentials.email,
        password: credentials.password
      };
      
      const response = await axios.post(`${API_URL}/auth/login`, loginData);
      
      // Verificar o formato da resposta da API atual
      if (response.data.status === 'ok') {
        // Extrair tokens e informações do usuário
        const accessToken = response.data.access_token;
        const user = response.data.user || {};
        
        // Armazenar tokens e informações do usuário
        this.setSession(
          accessToken,
          response.data.refresh_token || null,
          user
        );
        
        return {
          success: true,
          user: user
        };
      }
      
      return {
        success: false,
        message: response.data.message || 'Erro ao realizar login'
      };
    } catch (error) {
      console.error('Erro ao realizar login:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Erro ao realizar login'
      };
    }
  }
  
  /**
   * Realiza o registro de um novo usuário
   */
  async register(userData) {
    try {
      // Formatar dados conforme esperado pela API
      const registerData = {
        email: userData.email,
        password: userData.password,
        name: userData.name || userData.fullName,
        username: userData.username || userData.email.split('@')[0]
      };
      
      const response = await axios.post(`${API_URL}/auth/register`, registerData);
      
      if (response.data.status === 'ok') {
        // Se o registro retornar tokens de acesso, armazenar sessão
        if (response.data.access_token) {
          this.setSession(
            response.data.access_token,
            response.data.refresh_token || null,
            response.data.user
          );
        }
        
        return {
          success: true,
          user: response.data.user,
          message: 'Registro realizado com sucesso'
        };
      }
      
      return {
        success: false,
        message: response.data.message || 'Erro ao registrar usuário'
      };
    } catch (error) {
      console.error('Erro ao registrar usuário:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Erro ao registrar usuário'
      };
    }
  }
  
  /**
   * Realiza o logout do usuário
   */
  async logout() {
    try {
      // Buscar token atual
      const token = this.getToken();
      
      if (token) {
        try {
          // Tentar fazer logout no servidor
          await axios.post(`${API_URL}/auth/logout`, {}, {
            headers: this.getAuthHeader()
          });
        } catch (error) {
          // Ignorar erros de servidor no logout
          console.warn('Erro ao fazer logout no servidor:', error);
        }
      }
      
      // Sempre limpar a sessão local, independente do resultado do servidor
      this.clearSession();
      
      return {
        success: true,
        message: 'Logout realizado com sucesso'
      };
    } catch (error) {
      console.error('Erro ao realizar logout:', error);
      
      // Tentar limpar a sessão local mesmo em caso de erro
      this.clearSession();
      
      return {
        success: true, // Considerar sucesso mesmo com erro, pois a sessão local foi limpa
        message: 'Logout local realizado, mas houve um erro na comunicação com o servidor'
      };
    }
  }
  
  /**
   * Solicita a recuperação de senha
   */
  async requestPasswordReset(email) {
    try {
      const response = await axios.post(`${API_URL}/auth/request-reset`, { email });
      
      if (response.data.status === 'success') {
        return {
          success: true,
          message: response.data.message || 'Solicitação de recuperação enviada com sucesso'
        };
      }
      
      return {
        success: false,
        message: response.data.message || 'Erro ao solicitar recuperação de senha'
      };
    } catch (error) {
      console.error('Erro ao solicitar recuperação de senha:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Erro ao solicitar recuperação de senha'
      };
    }
  }
  
  /**
   * Verifica código de recuperação de senha
   */
  async verifyResetCode(email, code) {
    try {
      const response = await axios.post(`${API_URL}/auth/verify-reset-code`, { 
        email, 
        code 
      });
      
      if (response.data.status === 'success') {
        return {
          success: true,
          message: response.data.message || 'Código verificado com sucesso'
        };
      }
      
      return {
        success: false,
        message: response.data.message || 'Código inválido ou expirado'
      };
    } catch (error) {
      console.error('Erro ao verificar código de recuperação:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Erro ao verificar código'
      };
    }
  }
  
  /**
   * Redefine a senha do usuário
   */
  async resetPassword(email, code, password) {
    try {
      const response = await axios.post(`${API_URL}/auth/reset-password`, { 
        email, 
        code,
        password
      });
      
      if (response.data.status === 'success') {
        return {
          success: true,
          message: response.data.message || 'Senha redefinida com sucesso'
        };
      }
      
      return {
        success: false,
        message: response.data.message || 'Erro ao redefinir senha'
      };
    } catch (error) {
      console.error('Erro ao redefinir senha:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Erro ao redefinir senha'
      };
    }
  }
  
  /**
   * Define a sessão do usuário
   */
  setSession(token, refreshToken, userInfo = null) {
    if (token) {
      localStorage.setItem(AUTH_TOKEN_KEY, token);
    }
    
    if (refreshToken) {
      localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
    }
    
    if (userInfo) {
      localStorage.setItem(USER_INFO_KEY, JSON.stringify(userInfo));
    }
  }
  
  /**
   * Limpa a sessão do usuário
   */
  clearSession() {
    localStorage.removeItem(AUTH_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(USER_INFO_KEY);
  }
  
  /**
   * Obtém o cabeçalho de autenticação para requisições
   */
  getAuthHeader() {
    const token = this.getToken();
    return token ? { 'Authorization': `Bearer ${token}` } : {};
  }
  
  /**
   * Configura interceptores para o axios
   */
  setupAxiosInterceptors() {
    // Interceptador de requisições
    axios.interceptors.request.use(
      (config) => {
        // Adicionar cabeçalho de autenticação se houver token
        const token = this.getToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );
    
    // Interceptador de respostas
    axios.interceptors.response.use(
      (response) => response,
      async (error) => {
        // Verificar se é erro de token expirado (401)
        if (error.response && error.response.status === 401) {
          // Tentar atualizar o token
          const refreshSuccess = await this.refreshToken();
          
          if (refreshSuccess) {
            // Reenviar a requisição original com o novo token
            const originalRequest = error.config;
            originalRequest.headers.Authorization = `Bearer ${this.getToken()}`;
            return axios(originalRequest);
          }
          
          // Se a atualização falhar, deslogar o usuário
          this.clearSession();
          
          // Redirecionar para a página de login
          if (typeof window !== 'undefined') {
            window.location.href = '/login';
          }
        }
        
        return Promise.reject(error);
      }
    );
  }
  
  /**
   * Verifica se o usuário está autenticado localmente
   */
  isAuthenticated() {
    return !!this.getToken();
  }
  
  /**
   * Redirecionar para o dashboard
   */
  redirectToDashboard() {
    if (this.isAuthenticated() && typeof window !== 'undefined') {
      window.location.href = '/dashboard';
      return true;
    }
    return false;
  }
}

// Instância singleton
const authService = new AuthService();

// Configurar interceptadores globais
authService.setupAxiosInterceptors();

export default authService;

// Exportar helpers
export const getAuthHeader = () => authService.getAuthHeader(); 