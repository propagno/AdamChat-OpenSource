/**
 * auth.js
 * Funções de autenticação seguras para o sistema AdamChat
 */

// Configuração global de autenticação
const AuthConfig = {
    apiBaseUrl: '/api',
    authEndpoints: {
        login: '/api/auth/login',
        register: '/api/auth/register',
        logout: '/api/auth/logout',
        status: '/api/auth/status'
    },
    tokenKey: 'access_token',
    refreshTokenKey: 'refresh_token',
    userKey: 'user_data',
    sessionTimeout: 1800000, // 30 minutos em milissegundos
    useSecureCookies: true,
    csrfTokenHeader: 'X-CSRF-Token'
};

/**
 * Carrega a configuração de autenticação do servidor
 * @returns {Promise<Object>} Configuração de autenticação
 */
async function loadAuthConfig() {
    try {
        const response = await fetch('/config/auth-config.json');
        if (!response.ok) {
            console.warn('Não foi possível carregar configuração de autenticação. Usando padrões.');
            return AuthConfig;
        }
        const config = await response.json();
        
        // Mesclar com configurações padrão
        return { ...AuthConfig, ...config };
    } catch (error) {
        console.error('Erro ao carregar configuração de autenticação:', error);
        return AuthConfig;
    }
}

/**
 * Login de usuário com credenciais
 * @param {string} email Email do usuário
 * @param {string} password Senha do usuário
 * @returns {Promise<Object>} Resultado da autenticação
 */
async function login(email, password) {
    try {
        const config = await loadAuthConfig();
        const loginEndpoint = config.authEndpoints.login;
        
        // Adicionar proteção CSRF, se disponível
        const headers = {
            'Content-Type': 'application/json'
        };
        
        // Obter token CSRF se disponível
        const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
        if (csrfToken) {
            headers[config.csrfTokenHeader] = csrfToken;
        }
        
        const response = await fetch(loginEndpoint, {
            method: 'POST',
            headers,
            body: JSON.stringify({ email, password }),
            credentials: 'same-origin' // Inclui cookies na requisição
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.message || 'Erro ao fazer login');
        }
        
        // Processar resultado de login bem-sucedido
        if (data.access_token || data.token) {
            // Salvar tokens e informações de usuário de forma segura
            localStorage.setItem(config.tokenKey, data.access_token || data.token);
            
            if (data.refresh_token) {
                localStorage.setItem(config.refreshTokenKey, data.refresh_token);
            }
            
            if (data.user) {
                // Nunca armazene a senha no localStorage
                const user = { ...data.user };
                delete user.password;
                localStorage.setItem(config.userKey, JSON.stringify(user));
            }
            
            return {
                success: true,
                message: 'Login realizado com sucesso',
                user: data.user || null,
                token: data.access_token || data.token
            };
        } else if (data.status === 'ok') {
            // Modo de demonstração/desenvolvimento
            console.warn('API retornou sucesso sem token. Usando modo de demonstração.');
            localStorage.setItem('demo_user', email);
            localStorage.setItem('is_authenticated', 'true');
            
            return {
                success: true,
                message: 'Login realizado com sucesso (modo de demonstração)',
                demo: true
            };
        } else {
            throw new Error('Resposta de login inválida');
        }
    } catch (error) {
        console.error('Erro no processo de login:', error);
        return {
            success: false,
            message: error.message || 'Erro ao processar login',
            error
        };
    }
}

/**
 * Registro de novo usuário
 * @param {Object} userData Dados do usuário (nome, email, senha)
 * @returns {Promise<Object>} Resultado do registro
 */
async function register(userData) {
    try {
        const config = await loadAuthConfig();
        const registerEndpoint = config.authEndpoints.register;
        
        // Adicionar proteção CSRF, se disponível
        const headers = {
            'Content-Type': 'application/json'
        };
        
        // Obter token CSRF se disponível
        const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
        if (csrfToken) {
            headers[config.csrfTokenHeader] = csrfToken;
        }
        
        const response = await fetch(registerEndpoint, {
            method: 'POST',
            headers,
            body: JSON.stringify(userData),
            credentials: 'same-origin' // Inclui cookies na requisição
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.message || 'Erro ao registrar usuário');
        }
        
        return {
            success: true,
            message: data.message || 'Registro realizado com sucesso',
            data
        };
    } catch (error) {
        console.error('Erro no processo de registro:', error);
        return {
            success: false,
            message: error.message || 'Erro ao processar registro',
            error
        };
    }
}

/**
 * Verifica se o usuário está autenticado
 * @returns {boolean} Status da autenticação
 */
function isAuthenticated() {
    const token = localStorage.getItem(AuthConfig.tokenKey);
    const demoUser = localStorage.getItem('demo_user');
    const isAuthenticatedFlag = localStorage.getItem('is_authenticated');
    
    return !!token || (demoUser && isAuthenticatedFlag === 'true');
}

/**
 * Faz logout do usuário
 * @returns {Promise<Object>} Resultado do logout
 */
async function logout() {
    try {
        const config = await loadAuthConfig();
        
        // Limpar armazenamento local
        localStorage.removeItem(config.tokenKey);
        localStorage.removeItem(config.refreshTokenKey);
        localStorage.removeItem(config.userKey);
        localStorage.removeItem('demo_user');
        localStorage.removeItem('is_authenticated');
        
        // Chamar API de logout se disponível
        try {
            const response = await fetch(config.authEndpoints.logout, {
                method: 'POST',
                credentials: 'same-origin'
            });
            
            if (!response.ok) {
                console.warn('API de logout retornou erro');
            }
        } catch (apiError) {
            console.warn('Erro ao chamar API de logout:', apiError);
        }
        
        return {
            success: true,
            message: 'Logout realizado com sucesso'
        };
    } catch (error) {
        console.error('Erro no processo de logout:', error);
        return {
            success: false,
            message: error.message || 'Erro ao processar logout',
            error
        };
    }
}

/**
 * Obtém os dados do usuário atual
 * @returns {Object|null} Dados do usuário ou null se não estiver autenticado
 */
function getCurrentUser() {
    try {
        const userJson = localStorage.getItem(AuthConfig.userKey);
        if (userJson) {
            return JSON.parse(userJson);
        }
        
        const demoUser = localStorage.getItem('demo_user');
        if (demoUser && localStorage.getItem('is_authenticated') === 'true') {
            return {
                email: demoUser,
                name: 'Usuário de Demonstração',
                demo: true
            };
        }
        
        return null;
    } catch (error) {
        console.error('Erro ao obter dados do usuário:', error);
        return null;
    }
}

/**
 * Obtém o token de autenticação atual
 * @returns {string|null} Token de autenticação ou null se não estiver autenticado
 */
function getAuthToken() {
    return localStorage.getItem(AuthConfig.tokenKey);
}

// Exportar funções para uso global
window.AuthService = {
    login,
    register,
    logout,
    isAuthenticated,
    getCurrentUser,
    getAuthToken,
    loadAuthConfig
}; 