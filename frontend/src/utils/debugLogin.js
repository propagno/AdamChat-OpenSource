/**
 * Utilitário para depuração do processo de login
 */

/**
 * Registra informações sensíveis do processo de login no localStorage
 * para fins de diagnóstico (use apenas temporariamente para depuração)
 */
export const enableLoginDebug = () => {
  localStorage.setItem('DEBUG_LOGIN', 'true');
  console.log('🐞 Modo de debug do login ativado');
};

/**
 * Desativa o registro de debug do login
 */
export const disableLoginDebug = () => {
  localStorage.removeItem('DEBUG_LOGIN');
  localStorage.removeItem('DEBUG_LOGIN_DATA');
  console.log('✅ Modo de debug do login desativado');
};

/**
 * Verifica se o debug de login está ativado
 */
export const isLoginDebugEnabled = () => {
  return localStorage.getItem('DEBUG_LOGIN') === 'true';
};

/**
 * Registra um passo do processo de login para debug
 */
export const logLoginStep = (step, data = {}) => {
  if (!isLoginDebugEnabled()) return;
  
  // Adicionar timestamp
  const timestamp = new Date().toISOString();
  
  // Recuperar logs anteriores
  const previousLogs = JSON.parse(localStorage.getItem('DEBUG_LOGIN_DATA') || '[]');
  
  // Adicionar novo log
  const newLog = {
    step,
    timestamp,
    data
  };
  
  previousLogs.push(newLog);
  
  // Limitar a 50 entradas para não sobrecarregar o localStorage
  const trimmedLogs = previousLogs.slice(-50);
  
  // Salvar no localStorage
  localStorage.setItem('DEBUG_LOGIN_DATA', JSON.stringify(trimmedLogs));
  
  // Exibir no console
  console.log(`🐞 [LOGIN DEBUG] ${timestamp} - ${step}`, data);
};

/**
 * Retorna todos os logs de debug do login
 */
export const getLoginDebugLogs = () => {
  return JSON.parse(localStorage.getItem('DEBUG_LOGIN_DATA') || '[]');
};

/**
 * Limpa os logs de debug do login
 */
export const clearLoginDebugLogs = () => {
  localStorage.setItem('DEBUG_LOGIN_DATA', '[]');
  console.log('🧹 Logs de debug do login limpos');
};

/**
 * Realiza uma verificação completa das condições para login
 */
export const diagnoseLongStatus = async () => {
  // Verificar localStorage
  const token = localStorage.getItem('access_token');
  const refreshToken = localStorage.getItem('refresh_token');
  const userInfo = localStorage.getItem('user_info');
  
  // Verificar conexão com backend
  let backendStatus = 'unknown';
  try {
    const response = await fetch('http://localhost:5000/api/health');
    backendStatus = response.ok ? 'online' : `error (${response.status})`;
  } catch (error) {
    backendStatus = `unreachable (${error.message})`;
  }
  
  // Retornar diagnóstico
  return {
    timestamp: new Date().toISOString(),
    localStorage: {
      token: token ? 'present' : 'missing',
      refreshToken: refreshToken ? 'present' : 'missing',
      userInfo: userInfo ? 'present' : 'missing',
    },
    backend: backendStatus,
    browser: navigator.userAgent,
    url: window.location.href
  };
};

export default {
  enableLoginDebug,
  disableLoginDebug,
  isLoginDebugEnabled,
  logLoginStep,
  getLoginDebugLogs,
  clearLoginDebugLogs,
  diagnoseLongStatus
}; 