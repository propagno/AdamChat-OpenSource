// Utilitário para testar a conexão com a API
import axios from 'axios';

/**
 * Realiza uma série de testes para verificar a conexão com a API
 * @returns {Promise<Object>} Resultado dos testes
 */
const testApiConnection = async () => {
  const results = {
    tests: [],
    summary: {
      total: 0,
      passed: 0,
      failed: 0
    }
  };

  // Funções auxiliares para os testes
  const addResult = (name, success, details) => {
    results.tests.push({
      name,
      success,
      details,
      timestamp: new Date().toISOString()
    });
    
    results.summary.total++;
    if (success) {
      results.summary.passed++;
    } else {
      results.summary.failed++;
    }
  };

  // Teste 1: Verificar configurações
  try {
    console.log('Teste 1: Verificando configurações do ambiente');
    const envInfo = {
      location: window.location.toString(),
      origin: window.location.origin,
      host: window.location.host,
      protocol: window.location.protocol,
      baseUrl: axios.defaults.baseURL || 'não definido',
      apiClient: JSON.stringify({
        baseURL: axios.defaults.baseURL || 'não definido',
        timeout: axios.defaults.timeout || 'não definido'
      })
    };
    
    addResult('Configurações do ambiente', true, envInfo);
  } catch (error) {
    console.error('Erro ao verificar configurações:', error);
    addResult('Configurações do ambiente', false, {
      message: error.message
    });
  }

  // Teste 2: Verificar se o proxy está funcionando
  try {
    console.log('Teste 2: Verificando proxy - GET /api/health');
    const startTime = Date.now();
    const response = await axios.get('/api/health', { timeout: 10000 });
    const endTime = Date.now();
    addResult('Proxy GET /api/health', true, {
      status: response.status,
      data: response.data,
      timeMs: endTime - startTime
    });
  } catch (error) {
    console.error('Erro no teste de proxy:', error);
    addResult('Proxy GET /api/health', false, {
      message: error.message,
      code: error.code,
      response: error.response ? {
        status: error.response.status,
        data: error.response.data
      } : 'Sem resposta'
    });
  }

  // Teste 3: Verificar conexão direta (sem JSON)
  try {
    console.log('Teste 3: Conexão direta - GET /api/auth/status');
    const startTime = Date.now();
    const response = await axios.get('/api/auth/status', { timeout: 10000 });
    const endTime = Date.now();
    addResult('Conexão direta GET /api/auth/status', true, {
      status: response.status,
      data: response.data,
      timeMs: endTime - startTime
    });
  } catch (error) {
    console.error('Erro na conexão direta:', error);
    addResult('Conexão direta GET /api/auth/status', false, {
      message: error.message,
      code: error.code,
      response: error.response ? {
        status: error.response.status,
        data: error.response.data
      } : 'Sem resposta'
    });
  }

  // Teste 4: Enviar dados como application/json
  try {
    console.log('Teste 4: POST com application/json');
    const startTime = Date.now();
    const testData = { test: true, timestamp: Date.now() };
    console.log('Enviando dados:', JSON.stringify(testData));
    
    const response = await axios.post('/api/auth/ping', 
      testData,
      { 
        timeout: 10000,
        headers: { 'Content-Type': 'application/json' }
      }
    );
    const endTime = Date.now();
    addResult('POST com application/json', true, {
      status: response.status,
      data: response.data,
      timeMs: endTime - startTime
    });
  } catch (error) {
    console.error('Erro no POST com application/json:', error);
    addResult('POST com application/json', false, {
      message: error.message,
      code: error.code,
      response: error.response ? {
        status: error.response.status,
        data: error.response.data
      } : 'Sem resposta'
    });
  }

  // Teste 5: Simulação de login (apenas para teste de comunicação)
  try {
    console.log('Teste 5: Simulação de login');
    const loginPayload = { 
      email: "test@example.com", 
      password: "password123" 
    };
    console.log('Enviando dados de login:', JSON.stringify(loginPayload));
    
    const startTime = Date.now();
    const response = await axios.post('/api/auth/login', 
      loginPayload,
      { 
        timeout: 10000,
        headers: { 
          'Content-Type': 'application/json',
          'X-Test-Mode': 'true'
        }
      }
    );
    const endTime = Date.now();
    addResult('Simulação de login', true, {
      status: response.status,
      data: response.data,
      timeMs: endTime - startTime
    });
  } catch (error) {
    console.error('Erro na simulação de login:', error);
    addResult('Simulação de login', false, {
      message: error.message,
      code: error.code,
      response: error.response ? {
        status: error.response.status,
        data: error.response.data
      } : 'Sem resposta',
      request: error.config ? {
        method: error.config.method,
        url: error.config.url,
        headers: error.config.headers,
        data: error.config.data
      } : 'Sem request'
    });
  }

  // Teste 6: Testar acesso direto ao backend via servidor local
  try {
    console.log('Teste 6: Acesso direto ao backend via localhost');
    const directClient = axios.create({
      baseURL: 'http://localhost:5000',
      timeout: 10000,
      headers: { 'Content-Type': 'application/json' }
    });
    
    const startTime = Date.now();
    const response = await directClient.get('/api/health');
    const endTime = Date.now();
    
    addResult('Acesso direto via localhost', true, {
      status: response.status,
      data: response.data,
      timeMs: endTime - startTime
    });
  } catch (error) {
    console.error('Erro no acesso direto via localhost:', error);
    addResult('Acesso direto via localhost', false, {
      message: error.message,
      code: error.code,
      response: error.response ? {
        status: error.response.status,
        data: error.response.data
      } : 'Sem resposta'
    });
  }

  return results;
};

export default testApiConnection; 