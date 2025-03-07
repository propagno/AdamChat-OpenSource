/**
 * Cliente API centralizado para comunicação com o backend.
 * Configura interceptores e tratamento de erros para todas as requisições.
 */
import axios from 'axios';
import { getLocalStorageItem, removeLocalStorageItem } from '../utils/storage';

// Constantes para chaves de armazenamento
export const STORAGE_KEYS = {
  ACCESS_TOKEN: 'access_token',
  REFRESH_TOKEN: 'refresh_token',
  USER_DATA: 'user_data',
  // Adicionar aliases para compatibilidade com código existente
  AUTH_TOKEN: 'access_token',
  USER_INFO: 'user_data'
};

// URL base do backend
const BASE_URL = 'http://localhost:5000';

// Mostrar a URL base para diagnóstico
console.log('API Client configurado para:', BASE_URL);

// Instância do Axios para comunicação com o backend
const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 10000, // 10 segundos
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});

// Interceptor para adicionar token de autenticação às requisições
apiClient.interceptors.request.use(
  (config) => {
    const token = getLocalStorageItem(STORAGE_KEYS.ACCESS_TOKEN);
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    console.error('Erro na interceptação da requisição:', error);
    return Promise.reject(error);
  }
);

// Interceptor para tratamento de respostas
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    // Log detalhado do erro para diagnóstico
    console.error('Erro na resposta da API:', error);
    
    // Mostrar informações detalhadas se disponíveis
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Dados:', error.response.data);
      console.error('Headers:', error.response.headers);
    } else if (error.request) {
      console.error('Requisição feita, mas sem resposta:', error.request);
    } else {
      console.error('Erro na configuração da requisição:', error.message);
    }
    
    // Aqui poderíamos implementar lógica para refresh de token em caso de 401
    // if (error.response && error.response.status === 401) { ... }
    
    return Promise.reject(error);
  }
);

/**
 * Verifica a saúde da API
 * @returns {Promise<boolean>} Promise que resolve para true se a API estiver saudável
 */
export const checkApiHealth = async () => {
  try {
    const response = await apiClient.get('/api/health');
    return response.status === 200;
  } catch (error) {
    console.error('Erro ao verificar saúde da API:', error);
    return false;
  }
};

export default apiClient; 