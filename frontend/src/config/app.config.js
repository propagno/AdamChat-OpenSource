/**
 * Configuração centralizada da aplicação
 * Este arquivo contém todas as configurações globais do aplicativo
 */

// URLs de API
export const API_CONFIG = {
  BASE_URL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
  TIMEOUT: 30000, // 30 segundos
  RETRY_ATTEMPTS: 3,
};

// Configurações para serviços externos de IA
export const AI_PROVIDERS = {
  // Stability AI para imagens e vídeos
  STABILITY_AI: {
    baseUrl: 'https://api.stability.ai/v1',
    apiKey: process.env.REACT_APP_STABILITY_AI_KEY || '',
  },
  // OpenAI para texto, imagens e assistência
  OPENAI: {
    baseUrl: 'https://api.openai.com/v1',
    apiKey: process.env.REACT_APP_OPENAI_KEY || '',
  },
  // Replicate para avatares e roupas virtuais
  REPLICATE: {
    baseUrl: 'https://api.replicate.com/v1',
    apiKey: process.env.REACT_APP_REPLICATE_KEY || '',
  }
};

// Configurações para armazenamento local
export const STORAGE_KEYS = {
  AUTH_TOKEN: 'access_token',
  REFRESH_TOKEN: 'refresh_token',
  USER_INFO: 'user_info',
  THEME_PREFERENCE: 'theme_preference',
  LANGUAGE: 'language_preference',
};

// Configuração de idiomas suportados
export const SUPPORTED_LANGUAGES = [
  { code: 'pt-BR', name: 'Português' },
  { code: 'en-US', name: 'English' },
  { code: 'es-ES', name: 'Español' },
];

// Configurações de limite de uso de API
export const RATE_LIMITS = {
  CHAT_MESSAGES_PER_MINUTE: 20,
  IMAGE_GENERATIONS_PER_HOUR: 10,
  VIDEO_GENERATIONS_PER_DAY: 5,
};

// Configurações de feature flags
export const FEATURES = {
  ENABLE_VIDEO_GENERATION: true,
  ENABLE_FASHION_FEATURES: true,
  ENABLE_EBOOK_EDITOR: true,
  ENABLE_AVATAR_CREATOR: true,
  ENABLE_DARK_MODE: true,
};

// Configurações de tempo para sessão
export const SESSION_CONFIG = {
  IDLE_TIMEOUT: 30 * 60 * 1000, // 30 minutos em ms
  REFRESH_INTERVAL: 10 * 60 * 1000, // 10 minutos em ms
  ABSOLUTE_TIMEOUT: 24 * 60 * 60 * 1000, // 24 horas em ms
};

export default {
  API_CONFIG,
  AI_PROVIDERS,
  STORAGE_KEYS,
  SUPPORTED_LANGUAGES,
  RATE_LIMITS,
  FEATURES,
  SESSION_CONFIG,
}; 