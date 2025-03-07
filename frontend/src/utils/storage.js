/**
 * Utilitários para gerenciar o armazenamento local (localStorage)
 * com tratamento de erros e suporte a objetos JSON.
 */

/**
 * Salva um item no localStorage
 * @param {string} key - Chave para armazenamento
 * @param {any} value - Valor a ser armazenado (será convertido para JSON se for objeto)
 * @returns {boolean} - true se o armazenamento foi bem-sucedido
 */
export const setLocalStorageItem = (key, value) => {
  try {
    // Converter objetos para string JSON
    const valueToStore = typeof value === 'object' ? JSON.stringify(value) : value;
    localStorage.setItem(key, valueToStore);
    console.log(`🔄 Storage: Item '${key}' armazenado com sucesso`);
    return true;
  } catch (error) {
    console.error(`Erro ao armazenar item '${key}' no localStorage:`, error);
    return false;
  }
};

/**
 * Recupera um item do localStorage
 * @param {string} key - Chave do item a ser recuperado
 * @param {any} defaultValue - Valor padrão caso o item não exista
 * @returns {any} - Valor recuperado ou defaultValue
 */
export const getLocalStorageItem = (key, defaultValue = null) => {
  try {
    const item = localStorage.getItem(key);
    
    // Se o item não existir, retornar o valor padrão
    if (item === null) return defaultValue;
    
    // Tentar converter de JSON para objeto
    try {
      return JSON.parse(item);
    } catch {
      // Se não for JSON válido, retornar o valor como string
      return item;
    }
  } catch (error) {
    console.error(`Erro ao recuperar item '${key}' do localStorage:`, error);
    return defaultValue;
  }
};

/**
 * Remove um item do localStorage
 * @param {string} key - Chave do item a ser removido
 * @returns {boolean} - true se a remoção foi bem-sucedida
 */
export const removeLocalStorageItem = (key) => {
  try {
    localStorage.removeItem(key);
    console.log(`🗑️ Storage: Item '${key}' removido`);
    return true;
  } catch (error) {
    console.error(`Erro ao remover item '${key}' do localStorage:`, error);
    return false;
  }
};

/**
 * Limpa todo o localStorage
 * @returns {boolean} - true se a limpeza foi bem-sucedida
 */
export const clearLocalStorage = () => {
  try {
    localStorage.clear();
    console.log('🧹 Storage: Todos os itens removidos');
    return true;
  } catch (error) {
    console.error('Erro ao limpar localStorage:', error);
    return false;
  }
};

/**
 * Verifica se um item existe no localStorage
 * @param {string} key - Chave a ser verificada
 * @returns {boolean} - true se o item existe
 */
export const hasLocalStorageItem = (key) => {
  try {
    return localStorage.getItem(key) !== null;
  } catch (error) {
    console.error(`Erro ao verificar existência do item '${key}' no localStorage:`, error);
    return false;
  }
};

/**
 * Função de diagnóstico para mostrar o estado atual do localStorage
 * @param {Array<string>} keys - Lista de chaves específicas para verificar (opcional)
 * @returns {Object} - Estado do localStorage
 */
export const diagnoseLocalStorage = (keys = []) => {
  try {
    const report = {
      timestamp: new Date().toISOString(),
      allKeys: Object.keys(localStorage),
      data: {}
    };
    
    // Se não recebeu chaves específicas, usar todas as chaves
    const keysToCheck = keys.length > 0 ? keys : report.allKeys;
    
    // Verificar cada chave
    keysToCheck.forEach(key => {
      const value = localStorage.getItem(key);
      report.data[key] = {
        exists: value !== null,
        rawValue: value,
        parsed: null,
        isJSON: false
      };
      
      // Tentar parsear como JSON
      if (value !== null) {
        try {
          report.data[key].parsed = JSON.parse(value);
          report.data[key].isJSON = true;
        } catch {
          // Não é JSON válido
        }
      }
    });
    
    console.log('📊 Diagnóstico do localStorage:', report);
    return report;
  } catch (error) {
    console.error('Erro ao diagnosticar localStorage:', error);
    return { error: error.message };
  }
}; 