import axios from 'axios';
import { getAuthHeader } from './auth-service';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

// Função para tratar erros de requisição
const handleRequestError = (error, customMessage = null) => {
  console.error('User service error:', error);
  const errorMessage = customMessage || 
    (error.response && error.response.data.error) ||
    error.message || 
    'Erro ao processar solicitação';
  
  return {
    success: false,
    error: errorMessage
  };
};

/**
 * Obtém o perfil do usuário logado
 * @returns {Promise} Promise com a resposta da API
 */
export const getUserProfile = async () => {
  try {
    const response = await axios.get(`${API_URL}/users/profile`, {
      headers: getAuthHeader()
    });
    
    return { 
      success: true, 
      user: response.data 
    };
  } catch (error) {
    return handleRequestError(error, 'Erro ao obter perfil do usuário');
  }
};

/**
 * Atualiza o perfil do usuário
 * @param {FormData|Object} profileData Dados do perfil ou FormData com imagem
 * @returns {Promise} Promise com a resposta da API
 */
export const updateUserProfile = async (profileData) => {
  try {
    // Determina se os dados são FormData ou objeto
    const isFormData = profileData instanceof FormData;
    
    const config = {
      headers: {
        ...getAuthHeader(),
        'Content-Type': isFormData ? 'multipart/form-data' : 'application/json'
      }
    };
    
    const response = await axios.put(
      `${API_URL}/users/profile`, 
      profileData,
      config
    );
    
    return { 
      success: true, 
      user: response.data 
    };
  } catch (error) {
    return handleRequestError(error, 'Erro ao atualizar perfil do usuário');
  }
};

/**
 * Altera a senha do usuário
 * @param {Object} passwordData Dados de senha (current_password, new_password)
 * @returns {Promise} Promise com a resposta da API
 */
export const changePassword = async (passwordData) => {
  try {
    const response = await axios.post(`${API_URL}/users/change-password`, passwordData, {
      headers: getAuthHeader()
    });
    
    return { 
      success: true, 
      message: response.data.message || 'Senha alterada com sucesso' 
    };
  } catch (error) {
    return handleRequestError(error, 'Erro ao alterar senha');
  }
};

/**
 * Obtém as preferências do usuário
 * @returns {Promise} Promise com a resposta da API
 */
export const getUserPreferences = async () => {
  try {
    const response = await axios.get(`${API_URL}/users/preferences`, {
      headers: getAuthHeader()
    });
    
    return { 
      success: true, 
      preferences: response.data 
    };
  } catch (error) {
    return handleRequestError(error, 'Erro ao obter preferências do usuário');
  }
};

/**
 * Atualiza as preferências do usuário
 * @param {Object} preferences Preferências do usuário
 * @returns {Promise} Promise com a resposta da API
 */
export const updateUserPreferences = async (preferences) => {
  try {
    const response = await axios.put(`${API_URL}/users/preferences`, preferences, {
      headers: getAuthHeader()
    });
    
    return { 
      success: true, 
      preferences: response.data 
    };
  } catch (error) {
    return handleRequestError(error, 'Erro ao atualizar preferências');
  }
};

/**
 * Solicita exclusão da conta do usuário
 * @param {Object} data Dados para exclusão (motivo, confirmação, etc)
 * @returns {Promise} Promise com a resposta da API
 */
export const requestAccountDeletion = async (data) => {
  try {
    const response = await axios.post(`${API_URL}/users/delete-request`, data, {
      headers: getAuthHeader()
    });
    
    return { 
      success: true, 
      message: response.data.message || 'Solicitação enviada com sucesso' 
    };
  } catch (error) {
    return handleRequestError(error, 'Erro ao solicitar exclusão da conta');
  }
}; 