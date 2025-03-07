// auth-api-test.js
// Script para testar a API de autenticação diretamente

const axios = require('axios');

// Configuração do cliente API
const API_URL = 'http://localhost:5000/api';
const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Dados do usuário de teste
const testUser = {
  name: 'Usuário API Teste',
  email: `teste-api-${Date.now()}@example.com`, // Garante email único
  password: 'Senha@123',
};

// Armazenamento para tokens
let accessToken = null;
let refreshToken = null;

async function runTests() {
  try {
    console.log('\n===== INICIANDO TESTES DA API DE AUTENTICAÇÃO =====\n');

    // 1. Testar registro de usuário
    console.log('1. Testando registro de usuário...');
    const registerResponse = await apiClient.post('/auth/register', testUser);
    
    if (registerResponse.status === 201) {
      console.log('✓ Usuário registrado com sucesso!');
      console.log(`Detalhes: ${JSON.stringify(registerResponse.data, null, 2)}`);
    } else {
      throw new Error(`Falha no registro. Status: ${registerResponse.status}`);
    }

    // 2. Testar login
    console.log('\n2. Testando login de usuário...');
    const loginResponse = await apiClient.post('/auth/login', {
      email: testUser.email,
      password: testUser.password,
    });
    
    if (loginResponse.status === 200 && loginResponse.data.access_token) {
      accessToken = loginResponse.data.access_token;
      refreshToken = loginResponse.data.refresh_token;
      console.log('✓ Login realizado com sucesso!');
      console.log(`Token recebido: ${accessToken.substring(0, 20)}...`);
    } else {
      throw new Error(`Falha no login. Status: ${loginResponse.status}`);
    }

    // 3. Validar o token
    console.log('\n3. Testando validação de token...');
    apiClient.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
    
    const validateResponse = await apiClient.get('/auth/validate-token');
    
    if (validateResponse.status === 200) {
      console.log('✓ Token validado com sucesso!');
      console.log(`Resposta: ${JSON.stringify(validateResponse.data, null, 2)}`);
    } else {
      throw new Error(`Falha na validação do token. Status: ${validateResponse.status}`);
    }

    // 4. Tentar acessar rota protegida
    console.log('\n4. Testando acesso a rota protegida...');
    const protectedResponse = await apiClient.get('/auth/protected');
    
    if (protectedResponse.status === 200) {
      console.log('✓ Acesso à rota protegida com sucesso!');
      console.log(`Resposta: ${JSON.stringify(protectedResponse.data, null, 2)}`);
    } else {
      throw new Error(`Falha no acesso à rota protegida. Status: ${protectedResponse.status}`);
    }

    // 5. Testar acesso sem token
    console.log('\n5. Testando acesso sem token (deve falhar)...');
    try {
      delete apiClient.defaults.headers.common['Authorization'];
      await apiClient.get('/auth/protected');
      throw new Error('Acesso permitido sem token - isso é um erro!');
    } catch (error) {
      if (error.response && error.response.status === 401) {
        console.log('✓ Acesso negado corretamente quando sem token!');
      } else {
        throw error;
      }
    }

    // 6. Testar refresh de token
    if (refreshToken) {
      console.log('\n6. Testando refresh de token...');
      const refreshResponse = await apiClient.post('/auth/refresh-token', {
        refresh_token: refreshToken,
      });
      
      if (refreshResponse.status === 200 && refreshResponse.data.access_token) {
        console.log('✓ Token atualizado com sucesso!');
        console.log(`Novo token: ${refreshResponse.data.access_token.substring(0, 20)}...`);
      } else {
        throw new Error(`Falha no refresh do token. Status: ${refreshResponse.status}`);
      }
    }

    console.log('\n===== TODOS OS TESTES CONCLUÍDOS COM SUCESSO! =====\n');
  } catch (error) {
    console.error('\n❌ ERRO DURANTE OS TESTES:');
    if (error.response) {
      console.error(`Status: ${error.response.status}`);
      console.error(`Dados: ${JSON.stringify(error.response.data, null, 2)}`);
    } else {
      console.error(error.message);
    }
  }
}

// Executar os testes
runTests(); 