import axios from 'axios';
import { getAuthHeader } from './auth-service';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

// Função para tratar erros de requisição
const handleRequestError = (error, customMessage = null) => {
  console.error('Payment service error:', error);
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
 * Obtém a lista de planos de assinatura disponíveis
 * @returns {Promise} Promise com a resposta da API
 */
export const getSubscriptionPlans = async () => {
  try {
    const response = await axios.get(`${API_URL}/payment/plans`, {
      headers: getAuthHeader()
    });
    
    return response.data;
  } catch (error) {
    return handleRequestError(error, 'Erro ao obter planos de assinatura');
  }
};

/**
 * Obtém os métodos de pagamento do usuário
 * @returns {Promise} Promise com a resposta da API
 */
export const getPaymentMethods = async () => {
  try {
    const response = await axios.get(`${API_URL}/payment/methods`, {
      headers: getAuthHeader()
    });
    
    return response.data;
  } catch (error) {
    return handleRequestError(error, 'Erro ao obter métodos de pagamento');
  }
};

/**
 * Adiciona um novo método de pagamento
 * @param {Object} paymentMethodData Dados do método de pagamento
 * @returns {Promise} Promise com a resposta da API
 */
export const addPaymentMethod = async (paymentMethodData) => {
  try {
    const response = await axios.post(`${API_URL}/payment/methods`, paymentMethodData, {
      headers: getAuthHeader()
    });
    
    return response.data;
  } catch (error) {
    return handleRequestError(error, 'Erro ao adicionar método de pagamento');
  }
};

/**
 * Remove um método de pagamento
 * @param {string} methodId ID do método de pagamento
 * @returns {Promise} Promise com a resposta da API
 */
export const deletePaymentMethod = async (methodId) => {
  try {
    const response = await axios.delete(`${API_URL}/payment/methods/${methodId}`, {
      headers: getAuthHeader()
    });
    
    return response.data;
  } catch (error) {
    return handleRequestError(error, 'Erro ao remover método de pagamento');
  }
};

/**
 * Realiza upgrade do plano de assinatura
 * @param {Object} upgradeData Dados para upgrade (plan_id, payment_method_id)
 * @returns {Promise} Promise com a resposta da API
 */
export const upgradePlan = async (upgradeData) => {
  try {
    const response = await axios.post(`${API_URL}/payment/upgrade`, upgradeData, {
      headers: getAuthHeader()
    });
    
    return response.data;
  } catch (error) {
    return handleRequestError(error, 'Erro ao fazer upgrade de plano');
  }
};

/**
 * Compra tokens adicionais
 * @param {Object} tokenData Dados para compra (amount, payment_method_id)
 * @returns {Promise} Promise com a resposta da API
 */
export const purchaseTokens = async (tokenData) => {
  try {
    const response = await axios.post(`${API_URL}/payment/tokens/add`, tokenData, {
      headers: getAuthHeader()
    });
    
    return response.data;
  } catch (error) {
    return handleRequestError(error, 'Erro ao comprar tokens');
  }
};

/**
 * Processa um token de pagamento do Stripe
 * @param {string} token Token de pagamento do Stripe
 * @returns {Promise} Promise com o método adicionado
 */
export const processStripeToken = async (token, setDefault = true) => {
  try {
    const paymentMethodData = {
      type: 'card',
      token: token.id,
      set_default: setDefault
    };
    
    return await addPaymentMethod(paymentMethodData);
  } catch (error) {
    return handleRequestError(error, 'Erro ao processar token do Stripe');
  }
};

/**
 * Obtém o saldo atual de tokens do usuário
 * @returns {Promise} Promise com o saldo de tokens
 */
export const getTokenBalance = async () => {
  try {
    const response = await axios.get(`${API_URL}/tokens/balance`, {
      headers: getAuthHeader()
    });
    
    return response.data;
  } catch (error) {
    return handleRequestError(error, 'Erro ao obter saldo de tokens');
  }
};

/**
 * Obtém o histórico de pagamentos do usuário
 * @param {number} page Número da página
 * @param {number} limit Limite de itens por página
 * @returns {Promise} Promise com o histórico de pagamentos
 */
export const getPaymentHistory = async (page = 1, limit = 10) => {
  try {
    const response = await axios.get(`${API_URL}/payment/history`, {
      headers: getAuthHeader(),
      params: { page, limit }
    });
    
    return response.data;
  } catch (error) {
    return handleRequestError(error, 'Erro ao obter histórico de pagamentos');
  }
};

/**
 * Cancela a renovação automática da assinatura
 * @returns {Promise} Promise com a resposta da API
 */
export const cancelAutoRenew = async () => {
  try {
    const response = await axios.post(`${API_URL}/payment/cancel-renewal`, {}, {
      headers: getAuthHeader()
    });
    
    return response.data;
  } catch (error) {
    return handleRequestError(error, 'Erro ao cancelar renovação automática');
  }
};

/**
 * Ativa a renovação automática da assinatura
 * @returns {Promise} Promise com a resposta da API
 */
export const enableAutoRenew = async () => {
  try {
    const response = await axios.post(`${API_URL}/payment/enable-renewal`, {}, {
      headers: getAuthHeader()
    });
    
    return response.data;
  } catch (error) {
    return handleRequestError(error, 'Erro ao ativar renovação automática');
  }
}; 