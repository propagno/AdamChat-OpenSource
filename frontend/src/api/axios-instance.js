import axios from 'axios';
import { API_CONFIG, STORAGE_KEYS } from '../config/app.config';

/**
 * Instância axios configurada para comunicação com a API
 * Inclui interceptors para gerenciamento de autenticação e erros
 */
const apiClient = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  timeout: API_CONFIG.TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  }
});

// Interceptor de requisição para adicionar token de autenticação
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Contador de tentativas de retentativa por URL
const retryCountMap = new Map();

// Interceptor de resposta para gerenciar erros e tentativas
apiClient.interceptors.response.use(
  (response) => {
    // Limpar contador de retentativas em caso de sucesso
    const url = response.config.url;
    if (retryCountMap.has(url)) {
      retryCountMap.delete(url);
    }
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    const url = originalRequest.url;
    
    // Verifica se existe o error.response para evitar erros em caso de problemas de rede
    if (!error.response) {
      console.error('Erro de rede:', error);
      return Promise.reject({
        message: 'Erro de conexão. Verifique sua conexão com a internet.',
        originalError: error
      });
    }

    // Obter ou inicializar o contador de retentativas
    let retryCount = retryCountMap.get(url) || 0;
    
    // Tentar novamente se for um erro 5xx e não excedeu o limite de tentativas
    if (error.response.status >= 500 && retryCount < API_CONFIG.RETRY_ATTEMPTS) {
      retryCount++;
      retryCountMap.set(url, retryCount);
      
      // Esperar tempo progressivo entre tentativas (backoff exponencial)
      const delayMs = Math.pow(2, retryCount) * 1000;
      await new Promise(resolve => setTimeout(resolve, delayMs));
      
      return apiClient(originalRequest);
    }
    
    // Erro 401 (Não autorizado) - Token possivelmente expirado
    if (error.response.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        // Tentar renovar o token
        const refreshToken = localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
        
        if (!refreshToken) {
          // Sem refresh token, redirecionar para login
          localStorage.clear();
          window.location.href = '/login';
          return Promise.reject(error);
        }
        
        const response = await axios.post(`${API_CONFIG.BASE_URL}/auth/refresh`, {
          refresh_token: refreshToken
        });
        
        // Armazenar novos tokens
        const { access_token, refresh_token } = response.data;
        localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, access_token);
        localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refresh_token);
        
        // Refazer a requisição original com o novo token
        originalRequest.headers.Authorization = `Bearer ${access_token}`;
        return apiClient(originalRequest);
      } catch (refreshError) {
        // Falha na renovação do token, redirecionar para login
        localStorage.clear();
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }
    
    // Para outros erros, rejeitar com informações úteis para debugging
    return Promise.reject({
      status: error.response.status,
      message: error.response.data.message || 'Ocorreu um erro ao processar sua solicitação',
      data: error.response.data,
      originalError: error
    });
  }
);

export default apiClient; 