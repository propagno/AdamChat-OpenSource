/**
 * Constantes para as rotas da aplicação
 * Centraliza todas as rotas em um único lugar para facilitar a manutenção
 */

export const ROUTES = {
  // Rotas públicas
  HOME: '/',
  LOGIN: '/login',
  
  // Rotas autenticadas
  DASHBOARD: '/dashboard',
  PROFILE: '/profile',
  
  // Rotas de chat
  CHAT: '/chat',
  CHAT_DETAIL: '/chat/:id',
  
  // Rotas de pacientes
  PATIENTS: '/patients',
  PATIENT_REGISTER: '/patients/register',
  PATIENT_EDIT: '/patients/edit/:id',
  PATIENT_DETAIL: '/patients/:id',
  
  // Rotas de ebooks
  EBOOKS: '/ebooks',
  EBOOK_GENERATOR: '/ebooks/generator',
  EBOOK_PREVIEW: '/ebooks/preview/:id',
  EBOOK_LIBRARY: '/ebooks/library',
  
  // Rotas de configuração
  SETTINGS: '/settings',
  
  // Rotas de erro
  NOT_FOUND: '*'
};

/**
 * Função para construir URLs com parâmetros de rota
 * @param {string} route - Rota com placeholders para parâmetros (ex: /patients/:id)
 * @param {Object} params - Objeto com os valores dos parâmetros
 * @returns {string} - URL com os parâmetros substituídos
 */
export const buildUrl = (route, params = {}) => {
  let url = route;
  
  // Substitui os placeholders pelos valores dos parâmetros
  Object.entries(params).forEach(([key, value]) => {
    url = url.replace(`:${key}`, value);
  });
  
  return url;
}; 