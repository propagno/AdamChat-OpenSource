/**
 * Logger para o frontend que envia logs estruturados para o Loki
 */

// Níveis de log
const LOG_LEVELS = {
  ERROR: 'error',
  WARN: 'warn',
  INFO: 'info',
  DEBUG: 'debug',
};

// Endpoint para enviar logs (opcional - pode ser configurado para enviar para um backend que encaminha para o Loki)
const LOG_ENDPOINT = '/api/logs';

/**
 * Formata uma mensagem de log no formato JSON para o Loki processar
 */
const formatLogMessage = (level, message, details = {}) => {
  const timestamp = new Date().toISOString();
  
  // Captura informações de navegação quando disponíveis
  const path = typeof window !== 'undefined' ? window.location.pathname : '';
  const userAgent = typeof navigator !== 'undefined' ? navigator.userAgent : '';
  
  // Calcule latência se fornecida
  const latency = details.latency || details.duration || null;
  
  // Formato estruturado para Loki processar via pipeline de estágios JSON
  return {
    timestamp,
    level,
    message,
    path,
    method: details.method || 'GET',
    status: details.status || '',
    latency,
    userAgent,
    ...details,
  };
};

/**
 * Salva log no localStorage para persistência temporária
 */
const saveLogToStorage = (logData) => {
  try {
    const logs = JSON.parse(localStorage.getItem('app_logs') || '[]');
    logs.push(logData);
    // Limita a 100 logs para não sobrecarregar o localStorage
    while (logs.length > 100) {
      logs.shift();
    }
    localStorage.setItem('app_logs', JSON.stringify(logs));
  } catch (error) {
    console.error('Erro ao salvar log no localStorage:', error);
  }
};

/**
 * Envia logs para o endpoint configurado
 */
const sendLogToServer = async (logData) => {
  try {
    if (typeof window === 'undefined') return;
    
    // Armazena log localmente primeiro
    saveLogToStorage(logData);
    
    // Opcionalmente, envia para um endpoint de backend
    if (LOG_ENDPOINT) {
      await fetch(LOG_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(logData),
      });
    }
  } catch (error) {
    console.error('Erro ao enviar log para o servidor:', error);
  }
};

/**
 * Logger para uso no frontend
 */
const logger = {
  error: (message, details = {}) => {
    const logData = formatLogMessage(LOG_LEVELS.ERROR, message, details);
    console.error(message, details);
    sendLogToServer(logData);
  },
  
  warn: (message, details = {}) => {
    const logData = formatLogMessage(LOG_LEVELS.WARN, message, details);
    console.warn(message, details);
    sendLogToServer(logData);
  },
  
  info: (message, details = {}) => {
    const logData = formatLogMessage(LOG_LEVELS.INFO, message, details);
    console.info(message, details);
    sendLogToServer(logData);
  },
  
  debug: (message, details = {}) => {
    if (process.env.NODE_ENV !== 'production') {
      const logData = formatLogMessage(LOG_LEVELS.DEBUG, message, details);
      console.debug(message, details);
      sendLogToServer(logData);
    }
  },
  
  // Logger específico para requisições HTTP com medição de latência
  httpRequest: (url, method, statusCode, startTime, details = {}) => {
    const endTime = Date.now();
    const latency = endTime - startTime;
    
    const level = statusCode >= 400 ? LOG_LEVELS.ERROR : LOG_LEVELS.INFO;
    const message = `${method} ${url} ${statusCode} - ${latency}ms`;
    
    const logData = formatLogMessage(level, message, {
      url,
      method,
      status: statusCode,
      latency,
      ...details,
    });
    
    if (statusCode >= 400) {
      console.error(message, { statusCode, latency, ...details });
    } else {
      console.info(message, { statusCode, latency, ...details });
    }
    
    sendLogToServer(logData);
  },
};

export default logger; 