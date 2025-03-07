/**
 * auth-helper.js
 * Utilitários para ajudar na autenticação e diagnóstico de problemas
 */

import authService from '../api/auth.service';

/**
 * Verificar se a API de autenticação está acessível
 * @returns {Promise<Object>} Status da API
 */
export const checkAuthApiStatus = async () => {
  try {
    const status = await authService.checkStatus();
    return {
      online: true,
      message: 'API de autenticação está online',
      details: status
    };
  } catch (error) {
    console.error('Erro ao verificar status da API de autenticação:', error);
    return {
      online: false,
      message: 'API de autenticação está offline ou inacessível',
      error: error?.message || 'Erro desconhecido'
    };
  }
};

/**
 * Diagnóstico completo da autenticação
 * @returns {Promise<Object>} Resultado do diagnóstico
 */
export const runAuthDiagnostic = async () => {
  const results = {
    api: await checkAuthApiStatus(),
    localStorage: checkLocalStorage(),
    tokens: null
  };
  
  // Se a API estiver online, verificar os tokens
  if (results.api.online) {
    results.tokens = await checkTokens();
  }
  
  return results;
};

/**
 * Verifica o estado do armazenamento local
 * @returns {Object} Estado do armazenamento local
 */
export const checkLocalStorage = () => {
  try {
    // Testar se o localStorage está disponível
    const testKey = '__test_key__';
    localStorage.setItem(testKey, 'test');
    localStorage.removeItem(testKey);
    
    // Verificar tokens e informações do usuário
    const hasAccessToken = !!authService.getToken();
    const hasRefreshToken = !!localStorage.getItem('refresh_token');
    const hasUserInfo = !!authService.getCurrentUser();
    
    return {
      available: true,
      hasAccessToken,
      hasRefreshToken,
      hasUserInfo,
      userInfo: hasUserInfo ? authService.getCurrentUser() : null
    };
  } catch (error) {
    console.error('Erro ao verificar localStorage:', error);
    return {
      available: false,
      error: error?.message || 'Erro desconhecido ao acessar localStorage'
    };
  }
};

/**
 * Verifica a validade dos tokens
 * @returns {Promise<Object>} Estado dos tokens
 */
export const checkTokens = async () => {
  try {
    const tokenStatus = await authService.validateToken();
    return {
      valid: tokenStatus?.valid === true,
      details: tokenStatus
    };
  } catch (error) {
    console.error('Erro ao verificar tokens:', error);
    return {
      valid: false,
      error: error?.message || 'Erro desconhecido ao validar tokens'
    };
  }
};

/**
 * Zera completamente o estado de autenticação (logout forçado)
 */
export const forceLogout = () => {
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
  localStorage.removeItem('user_info');
  
  // Forçar recarregamento da página para garantir estado limpo
  if (typeof window !== 'undefined') {
    window.location.href = '/login';
  }
};

export default {
  checkAuthApiStatus,
  runAuthDiagnostic,
  checkLocalStorage,
  checkTokens,
  forceLogout
}; 