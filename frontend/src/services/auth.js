// authCleanup.js - Funções para limpar completamente o estado de autenticação

/**
 * Limpa todos os cookies relacionados à autenticação
 */
export const clearAllCookies = () => {
  try {
    const cookies = document.cookie.split(';');
    
    // Log dos cookies para debug
    console.log('Cookies antes da limpeza:', cookies);
    
    for (let cookie of cookies) {
      const [name] = cookie.trim().split('=');
      if (name) {
        // Limpar o cookie em múltiplos domínios e paths para garantir
        const domains = [
          window.location.hostname,
          window.location.hostname.split('.').slice(1).join('.'),
          ''
        ];
        
        const paths = ['/', '/auth', '/realms', ''];
        
        // Tenta remover o cookie de todas as combinações possíveis
        for (const domain of domains) {
          for (const path of paths) {
            const cookieDelete = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=${path}${domain ? `; domain=${domain}` : ''}`;
            document.cookie = cookieDelete;
          }
        }
      }
    }
    
    // Verifica se os cookies foram realmente limpos
    console.log('Cookies após limpeza:', document.cookie);
    return true;
  } catch (e) {
    console.error('Erro ao limpar cookies:', e);
    return false;
  }
};

/**
 * Limpa toda a sessão e localStorage relacionados à autenticação
 */
export const clearStorage = () => {
  try {
    // Itens específicos de autenticação
    const authItems = [
      'auth_token', 'refresh_token', 'user_info', 'auth_state',
      'auth_session', 'auth_nonce', 'auth_callback'
    ];
    
    // Limpa SessionStorage específico
    for (const item of authItems) {
      sessionStorage.removeItem(item);
    }
    
    // Limpa localStorage específico
    for (const item of authItems) {
      localStorage.removeItem(item);
    }
    
    // Opcionalmente, limpar todo o sessionStorage
    // sessionStorage.clear();
    
    return true;
  } catch (e) {
    console.error('Erro ao limpar storage:', e);
    return false;
  }
};

/**
 * Limpa todos os dados de autenticação e reinicia o processo
 */
export const completeAuthReset = () => {
  try {
    console.log('Iniciando limpeza completa de autenticação...');
    
    // Limpa cookies
    clearAllCookies();
    
    // Limpa storage
    clearStorage();
    
    // Remove quaisquer parâmetros de URL que possam estar interferindo
    if (window.history && window.history.replaceState) {
      window.history.replaceState({}, document.title, window.location.pathname);
    }
    
    console.log('Limpeza de autenticação concluída com sucesso');
    return true;
  } catch (e) {
    console.error('Erro durante reset de autenticação:', e);
    return false;
  }
};

/**
 * Verifica se o usuário está preso em um loop de redirecionamento
 * @returns {boolean} Verdadeiro se detectou um loop
 */
export const detectRedirectLoop = () => {
  // Verifica a presença de "[object Promise]" ou outros indicadores de erro na URL
  if (window.location.href.includes('[object') || 
      window.location.href.includes('Promise') ||
      window.location.href.includes('undefined')) {
    console.error('Detectado loop de redirecionamento com URL inválida');
    return true;
  }
  
  // Verifica se estamos indo repetidamente para a mesma URL
  const redirectCount = parseInt(sessionStorage.getItem('redirect-count') || '0');
  const lastRedirectUrl = sessionStorage.getItem('last-redirect-url');
  const currentUrl = window.location.href;
  
  if (lastRedirectUrl === currentUrl) {
    sessionStorage.setItem('redirect-count', (redirectCount + 1).toString());
    
    // Se tiver sido redirecionado para a mesma URL mais de 3 vezes, assume que está em loop
    if (redirectCount > 3) {
      console.error('Detectado loop de redirecionamento (mesma URL repetidamente)');
      return true;
    }
  } else {
    // Atualiza a última URL de redirecionamento
    sessionStorage.setItem('last-redirect-url', currentUrl);
    sessionStorage.setItem('redirect-count', '1');
  }
  
  return false;
};

/**
 * Resolve o loop de redirecionamento, limpando tudo e voltando para a home
 */
export const breakRedirectLoop = () => {
  console.error('Interrompendo loop de redirecionamento e limpando estado de autenticação');
  
  completeAuthReset();
  
  // Limpa contadores de redirecionamento
  sessionStorage.removeItem('redirect-count');
  sessionStorage.removeItem('last-redirect-url');
  
  // Redireciona para a home, garantindo um estado limpo
  window.location.replace(window.location.origin);
};

// Verifica se o script está rodando em um ambiente de navegador
if (typeof window !== 'undefined') {
  // Verifica automaticamente por loops de redirecionamento quando o script carrega
  if (detectRedirectLoop()) {
    breakRedirectLoop();
  }
  
  // Adiciona listener de eventos para detectar loops durante a navegação
  window.addEventListener('load', () => {
    if (detectRedirectLoop()) {
      breakRedirectLoop();
    }
  });
} 