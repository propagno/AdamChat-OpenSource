import axiosInstance from './axios-instance';

/**
 * Serviços da API de Chat
 */
const chatApi = {
  /**
   * Cria uma nova conversa
   * @param {string} userId - ID do usuário
   * @param {string} title - Título da conversa
   * @returns {Promise} - Promessa com a resposta da API
   */
  createConversation: async (userId, title = 'Nova Conversa') => {
    try {
      const response = await axiosInstance.post('/conversations', {
        userId,
        title
      });
      return response.data;
    } catch (error) {
      console.error('Erro ao criar conversa:', error);
      throw error;
    }
  },

  /**
   * Obtém todas as conversas de um usuário
   * @param {string} userId - ID do usuário
   * @returns {Promise} - Promessa com a resposta da API
   */
  getConversations: async (userId) => {
    try {
      const response = await axiosInstance.get(`/users/${userId}/conversations`);
      return response.data;
    } catch (error) {
      console.error('Erro ao obter conversas:', error);
      throw error;
    }
  },

  /**
   * Obtém uma conversa específica
   * @param {string} conversationId - ID da conversa
   * @returns {Promise} - Promessa com a resposta da API
   */
  getConversation: async (conversationId) => {
    try {
      const response = await axiosInstance.get(`/conversations/${conversationId}`);
      return response.data;
    } catch (error) {
      console.error('Erro ao obter conversa:', error);
      throw error;
    }
  },

  /**
   * Atualiza uma conversa
   * @param {string} conversationId - ID da conversa
   * @param {string} title - Novo título da conversa
   * @returns {Promise} - Promessa com a resposta da API
   */
  updateConversation: async (conversationId, title) => {
    try {
      const response = await axiosInstance.put(`/conversations/${conversationId}`, {
        title
      });
      return response.data;
    } catch (error) {
      console.error('Erro ao atualizar conversa:', error);
      throw error;
    }
  },

  /**
   * Exclui uma conversa
   * @param {string} conversationId - ID da conversa
   * @returns {Promise} - Promessa com a resposta da API
   */
  deleteConversation: async (conversationId) => {
    try {
      const response = await axiosInstance.delete(`/conversations/${conversationId}`);
      return response.data;
    } catch (error) {
      console.error('Erro ao excluir conversa:', error);
      throw error;
    }
  },

  /**
   * Envia uma mensagem para a conversa
   * @param {string} userId - ID do usuário
   * @param {string} conversationId - ID da conversa
   * @param {string} content - Conteúdo da mensagem
   * @param {Object} params - Parâmetros opcionais
   * @returns {Promise} - Promessa com a resposta da API
   */
  sendMessage: async (userId, conversationId, content, params = {}) => {
    try {
      const response = await axiosInstance.post(`/messages`, {
        userId,
        conversationId,
        content,
        provider: params.provider || 'openai',
        model: params.model || 'gpt-3.5-turbo',
        maxTokens: params.maxTokens || 2048,
        temperature: params.temperature || 0.7
      });
      return response.data;
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
      throw error;
    }
  },

  /**
   * Obtém mensagens de uma conversa
   * @param {string} conversationId - ID da conversa
   * @returns {Promise} - Promessa com a resposta da API
   */
  getMessages: async (conversationId) => {
    try {
      const response = await axiosInstance.get(`/conversations/${conversationId}/messages`);
      return response.data;
    } catch (error) {
      console.error('Erro ao obter mensagens:', error);
      throw error;
    }
  },

  /**
   * Limpa mensagens de uma conversa
   * @param {string} conversationId - ID da conversa
   * @returns {Promise} - Promessa com a resposta da API
   */
  clearMessages: async (conversationId) => {
    try {
      const response = await axiosInstance.delete(`/conversations/${conversationId}/messages`);
      return response.data;
    } catch (error) {
      console.error('Erro ao limpar mensagens:', error);
      throw error;
    }
  },

  /**
   * Envia uma mensagem em modo streaming
   * @param {string} userId - ID do usuário
   * @param {string} conversationId - ID da conversa
   * @param {string} content - Conteúdo da mensagem
   * @param {Object} params - Parâmetros opcionais
   * @param {Function} onChunk - Callback para chunks de resposta
   * @returns {Promise} - Promessa com a resposta da API
   */
  streamMessage: async (userId, conversationId, content, params = {}, onChunk) => {
    try {
      const response = await axiosInstance.post(
        `/messages/stream`, 
        {
          userId,
          conversationId,
          content,
          provider: params.provider || 'openai',
          model: params.model || 'gpt-3.5-turbo',
          maxTokens: params.maxTokens || 2048,
          temperature: params.temperature || 0.7
        },
        {
          responseType: 'stream',
          onDownloadProgress: (progressEvent) => {
            const chunk = progressEvent.currentTarget.response;
            if (chunk && onChunk) {
              onChunk(chunk);
            }
          }
        }
      );
      return response.data;
    } catch (error) {
      console.error('Erro ao stream mensagem:', error);
      throw error;
    }
  },

  /**
   * Obtém a lista de provedores de IA disponíveis
   * @returns {Promise} - Promessa com a resposta da API
   */
  getProviders: async () => {
    try {
      const response = await axiosInstance.get('/providers');
      return response.data;
    } catch (error) {
      console.error('Erro ao obter provedores:', error);
      throw error;
    }
  },

  /**
   * Obtém as configurações do usuário
   * @param {string} userId - ID do usuário
   * @returns {Promise} - Promessa com a resposta da API
   */
  getUserSettings: async (userId) => {
    try {
      const response = await axiosInstance.get(`/users/${userId}/settings`);
      return response.data;
    } catch (error) {
      console.error('Erro ao obter configurações do usuário:', error);
      throw error;
    }
  },

  /**
   * Salva as configurações do usuário
   * @param {string} userId - ID do usuário
   * @param {Object} settings - Configurações a serem salvas
   * @returns {Promise} - Promessa com a resposta da API
   */
  saveUserSettings: async (userId, settings) => {
    try {
      const response = await axiosInstance.put(`/users/${userId}/settings`, settings);
      return response.data;
    } catch (error) {
      console.error('Erro ao salvar configurações do usuário:', error);
      throw error;
    }
  }
};

export default chatApi; 