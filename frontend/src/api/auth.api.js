/**
 * Serviço de API para autenticação simulado
 * Este arquivo fornece implementações simuladas das chamadas de API
 * para permitir o desenvolvimento sem um backend real
 */

// Simulação de delay de rede
const simulateDelay = () => new Promise(resolve => setTimeout(resolve, 800));

// Banco de dados simulado
const mockUsers = [
  {
    id: '1',
    email: 'admin@adamchat.com',
    password: 'admin123',
    name: 'Admin',
    role: 'admin'
  },
  {
    id: '2',
    email: 'user@adamchat.com',
    password: 'user123',
    name: 'Usuário Teste',
    role: 'user'
  }
];

/**
 * API de autenticação simulada
 */
const authApi = {
  /**
   * Verifica o status do sistema de autenticação
   * @returns {Promise} Objeto com informações de status
   */
  checkStatus: async () => {
    await simulateDelay();
    return {
      status: 'ok',
      message: 'Sistema de autenticação operacional',
      emergency_mode: false,
      auth_type: 'jwt'
    };
  },

  /**
   * Verifica a validade do token atual
   * @returns {Promise} Resultado da validação
   */
  validateToken: async () => {
    await simulateDelay();
    
    // Simulação: considera o token válido
    return { status: 200, data: { valid: true } };
  },

  /**
   * Realiza o login do usuário
   * @param {string} email - Email do usuário
   * @param {string} password - Senha do usuário
   * @returns {Promise} Dados do usuário e tokens
   */
  login: async (email, password) => {
    await simulateDelay();
    
    // Encontrar usuário no "banco de dados" simulado
    const user = mockUsers.find(u => u.email === email && u.password === password);
    
    if (user) {
      // Não retornar a senha no objeto de usuário
      const { password, ...userWithoutPassword } = user;
      
      return {
        data: {
          user: userWithoutPassword,
          access_token: `mock-token-${user.id}`,
          refresh_token: `mock-refresh-token-${user.id}`
        }
      };
    } else {
      throw new Error('Credenciais inválidas');
    }
  },

  /**
   * Realiza o logout do usuário
   * @returns {Promise} Resultado do logout
   */
  logout: async () => {
    await simulateDelay();
    return { status: 200, data: { success: true } };
  },

  /**
   * Obtém informações do usuário atual
   * @returns {Promise} Dados do usuário
   */
  getUserInfo: async () => {
    await simulateDelay();
    
    // Simulação: retorna informações do primeiro usuário mock
    const { password, ...user } = mockUsers[0];
    return { status: 200, data: user };
  }
};

export default authApi; 