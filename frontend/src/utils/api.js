/**
 * Utilitário central para chamadas de API
 * Encapsula lógica comum como autenticação, tratamento de erros, etc.
 */

// URL base da API
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

/**
 * Cliente HTTP para fazer requisições à API
 * @param {string} endpoint - Endpoint da API (sem a URL base)
 * @param {Object} options - Opções da requisição (método, corpo, headers, etc.)
 * @returns {Promise} - Promise com a resposta da requisição
 */
export const apiClient = async (endpoint, options = {}) => {
  // Configuração padrão da requisição
  const defaultOptions = {
    headers: {
      'Content-Type': 'application/json',
      // Adicione headers de autenticação aqui se necessário
    },
  };

  // Mescla as opções padrão com as opções passadas
  const fetchOptions = {
    ...defaultOptions,
    ...options,
    headers: {
      ...defaultOptions.headers,
      ...(options.headers || {}),
    },
  };

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, fetchOptions);
    
    // Verifica se a resposta foi bem-sucedida
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw {
        status: response.status,
        message: errorData.message || 'Erro desconhecido',
        data: errorData,
      };
    }
    
    // Verifica se a resposta tem conteúdo antes de tentar fazer o parse
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return await response.json();
    }
    
    return await response.text();
  } catch (error) {
    // Log do erro para debugging
    console.error('API Error:', error);
    throw error;
  }
};

/**
 * Funções auxiliares para diferentes métodos HTTP
 */
export const api = {
  get: (endpoint, options = {}) => apiClient(endpoint, { ...options, method: 'GET' }),
  post: (endpoint, data, options = {}) => apiClient(endpoint, { ...options, method: 'POST', body: JSON.stringify(data) }),
  put: (endpoint, data, options = {}) => apiClient(endpoint, { ...options, method: 'PUT', body: JSON.stringify(data) }),
  patch: (endpoint, data, options = {}) => apiClient(endpoint, { ...options, method: 'PATCH', body: JSON.stringify(data) }),
  delete: (endpoint, options = {}) => apiClient(endpoint, { ...options, method: 'DELETE' }),
}; 