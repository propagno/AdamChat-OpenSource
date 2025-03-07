import axios from 'axios';

const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Configuração das APIs externas para IA generativa
const AI_PROVIDERS = {
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

// Configuração para autorização com o servidor
const getAuthConfig = () => {
  const token = localStorage.getItem('token');
  return {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    }
  };
};

// Configuração para APIs de IA externas
const getAIConfig = (provider) => {
  const providerConfig = AI_PROVIDERS[provider];
  if (!providerConfig) {
    throw new Error(`Provider ${provider} não configurado`);
  }
  
  if (!providerConfig.apiKey) {
    throw new Error(`API key para ${provider} não configurada. Configure a variável de ambiente correspondente.`);
  }
  
  return {
    headers: {
      'Authorization': `Bearer ${providerConfig.apiKey}`,
      'Content-Type': 'application/json',
    }
  };
};

// Dashboard
export const getDashboardData = async () => {
  try {
    const response = await axios.get(`${BASE_URL}/dashboard`, getAuthConfig());
    return response.data;
  } catch (error) {
    console.error("Erro ao obter dados do dashboard:", error);
    throw error;
  }
};

// Planos e assinaturas
export const getAvailablePlans = async () => {
  try {
    const response = await axios.get(`${BASE_URL}/plans`, getAuthConfig());
    return response.data;
  } catch (error) {
    console.error("Erro ao obter planos disponíveis:", error);
    throw error;
  }
};

export const upgradePlan = async (planId, paymentMethodId = null) => {
  try {
    const response = await axios.post(
      `${BASE_URL}/plans/upgrade`, 
      { plan_id: planId, payment_method_id: paymentMethodId },
      getAuthConfig()
    );
    return response.data;
  } catch (error) {
    console.error("Erro ao fazer upgrade de plano:", error);
    throw error;
  }
};

// Tokens
export const addTokens = async (amount, paymentMethodId = null) => {
  try {
    const response = await axios.post(
      `${BASE_URL}/tokens/add`, 
      { amount, payment_method_id: paymentMethodId },
      getAuthConfig()
    );
    return response.data;
  } catch (error) {
    console.error("Erro ao adicionar tokens:", error);
    throw error;
  }
};

// Métodos de pagamento
export const getUserPaymentMethods = async () => {
  try {
    const response = await axios.get(`${BASE_URL}/payment-methods`, getAuthConfig());
    return response.data;
  } catch (error) {
    console.error("Erro ao obter métodos de pagamento:", error);
    throw error;
  }
};

export const addPaymentMethod = async (paymentMethodDetails) => {
  try {
    const response = await axios.post(
      `${BASE_URL}/payment-methods`, 
      paymentMethodDetails,
      getAuthConfig()
    );
    return response.data;
  } catch (error) {
    console.error("Erro ao adicionar método de pagamento:", error);
    throw error;
  }
};

export const deletePaymentMethod = async (paymentMethodId) => {
  try {
    const response = await axios.delete(
      `${BASE_URL}/payment-methods/${paymentMethodId}`, 
      getAuthConfig()
    );
    return response.data;
  } catch (error) {
    console.error("Erro ao excluir método de pagamento:", error);
    throw error;
  }
};

// Vídeos
export const generateVideo = async (prompt, style, duration) => {
  try {
    // Primeiro pedimos ao nosso backend para iniciar o processo e reservar recursos/tokens
    const initResponse = await axios.post(
      `${BASE_URL}/videos/generate`,
      { prompt, style, duration },
      getAuthConfig()
    );
    
    const { video_id, preset } = initResponse.data;
    
    // Agora iniciamos a geração real com a Stability AI
    try {
      const stabilityConfig = getAIConfig('STABILITY_AI');
      
      // Requisição para a API da Stability AI (Exemplo - ajuste conforme API real)
      await axios.post(
        `${AI_PROVIDERS.STABILITY_AI.baseUrl}/generation/text-to-video`,
        {
          text_prompts: [{ text: prompt }],
          video_length: durationToSeconds(duration),
          style_preset: mapStyleToPreset(style),
          webhook: `${BASE_URL}/webhooks/stability/video/${video_id}`
        },
        stabilityConfig
      );
      
      return { video_id, status: 'processing' };
    } catch (aiError) {
      // Se falhar na API externa, atualizamos o status no nosso servidor
      await axios.put(
        `${BASE_URL}/videos/${video_id}`,
        { status: 'failed', error_message: aiError.message },
        getAuthConfig()
      );
      throw aiError;
    }
  } catch (error) {
    console.error("Erro ao gerar vídeo:", error);
    throw error;
  }
};

export const checkVideoStatus = async (videoId) => {
  try {
    const response = await axios.get(
      `${BASE_URL}/videos/${videoId}/status`,
      getAuthConfig()
    );
    return response.data;
  } catch (error) {
    console.error("Erro ao verificar status do vídeo:", error);
    throw error;
  }
};

export const listUserVideos = async (limit = 20, status = null) => {
  try {
    const params = { limit };
    if (status) params.status = status;
    
    const response = await axios.get(
      `${BASE_URL}/videos`,
      { ...getAuthConfig(), params }
    );
    return response.data;
  } catch (error) {
    console.error("Erro ao listar vídeos do usuário:", error);
    throw error;
  }
};

export const deleteVideo = async (videoId) => {
  try {
    const response = await axios.delete(
      `${BASE_URL}/videos/${videoId}`,
      getAuthConfig()
    );
    return response.data;
  } catch (error) {
    console.error("Erro ao excluir vídeo:", error);
    throw error;
  }
};

// Função para transformar imagem em vídeo (variação de movimento)
export const imageToVideo = async (imageFile, prompt, duration = '5sec') => {
  try {
    // Primeiro fazemos upload da imagem para nosso servidor
    const formData = new FormData();
    formData.append('image', imageFile);
    formData.append('prompt', prompt);
    formData.append('duration', duration);
    
    const initResponse = await axios.post(
      `${BASE_URL}/videos/from-image`,
      formData,
      {
        ...getAuthConfig(),
        headers: {
          ...getAuthConfig().headers,
          'Content-Type': 'multipart/form-data'
        }
      }
    );
    
    const { video_id, presigned_url } = initResponse.data;
    
    // Agora enviamos para a API da Stability AI
    try {
      const stabilityConfig = getAIConfig('STABILITY_AI');
      
      await axios.post(
        `${AI_PROVIDERS.STABILITY_AI.baseUrl}/generation/image-to-video`,
        {
          image_url: presigned_url,
          motion_strength: 0.5,
          duration: durationToSeconds(duration),
          webhook: `${BASE_URL}/webhooks/stability/video/${video_id}`
        },
        stabilityConfig
      );
      
      return { video_id, status: 'processing' };
    } catch (aiError) {
      // Atualiza o status para falha em caso de erro
      await axios.put(
        `${BASE_URL}/videos/${video_id}`,
        { status: 'failed', error_message: aiError.message },
        getAuthConfig()
      );
      throw aiError;
    }
  } catch (error) {
    console.error("Erro ao transformar imagem em vídeo:", error);
    throw error;
  }
};

// Avatares
export const generateAvatar = async (avatarData) => {
  try {
    // Inicializa a requisição em nosso backend
    const initResponse = await axios.post(
      `${BASE_URL}/avatars/generate`,
      avatarData,
      getAuthConfig()
    );
    
    const { avatar_id } = initResponse.data;
    
    // Integra com Replicate para criar o avatar
    try {
      const replicateConfig = getAIConfig('REPLICATE');
      
      // Requisição para o modelo do Replicate (adapte conforme a API)
      await axios.post(
        `${AI_PROVIDERS.REPLICATE.baseUrl}/predictions`,
        {
          version: "30c1d0b916a6f8efce20577f71e0206eb2b0fff8bbfd357e5a9c9c13e9d3c654", // ID do modelo de avatar
          input: {
            prompt: avatarData.prompt,
            guidance_scale: 7.5,
            num_inference_steps: 50,
            seed: Math.floor(Math.random() * 1000000)
          },
          webhook: `${BASE_URL}/webhooks/replicate/avatar/${avatar_id}`,
          webhook_events_filter: ["completed"]
        },
        replicateConfig
      );
      
      return { avatar_id, status: 'processing' };
    } catch (aiError) {
      await axios.put(
        `${BASE_URL}/avatars/${avatar_id}`,
        { status: 'failed', error_message: aiError.message },
        getAuthConfig()
      );
      throw aiError;
    }
  } catch (error) {
    console.error("Erro ao gerar avatar:", error);
    throw error;
  }
};

export const checkAvatarStatus = async (avatarId) => {
  try {
    const response = await axios.get(
      `${BASE_URL}/avatars/${avatarId}/status`,
      getAuthConfig()
    );
    return response.data;
  } catch (error) {
    console.error("Erro ao verificar status do avatar:", error);
    throw error;
  }
};

export const listUserAvatars = async (limit = 20) => {
  try {
    const response = await axios.get(
      `${BASE_URL}/avatars`,
      { ...getAuthConfig(), params: { limit } }
    );
    return response.data;
  } catch (error) {
    console.error("Erro ao listar avatares do usuário:", error);
    throw error;
  }
};

export const updateAvatar = async (avatarId, data) => {
  try {
    const response = await axios.put(
      `${BASE_URL}/avatars/${avatarId}`,
      data,
      getAuthConfig()
    );
    return response.data;
  } catch (error) {
    console.error("Erro ao atualizar avatar:", error);
    throw error;
  }
};

export const deleteAvatar = async (avatarId) => {
  try {
    const response = await axios.delete(
      `${BASE_URL}/avatars/${avatarId}`,
      getAuthConfig()
    );
    return response.data;
  } catch (error) {
    console.error("Erro ao excluir avatar:", error);
    throw error;
  }
};

// Fotos Fashion
export const generateFashionPhoto = async (photoData) => {
  try {
    // Inicializa a requisição em nosso backend
    const initResponse = await axios.post(
      `${BASE_URL}/fashion-photos/generate`,
      photoData,
      getAuthConfig()
    );
    
    const { photo_id } = initResponse.data;
    
    // Integra com OpenAI para criar a foto fashion
    try {
      const openaiConfig = getAIConfig('OPENAI');
      
      // Prepara o prompt para foto fashion
      const enhancedPrompt = buildFashionPrompt(photoData);
      
      // Requisição para a API da OpenAI
      await axios.post(
        `${AI_PROVIDERS.OPENAI.baseUrl}/images/generations`,
        {
          prompt: enhancedPrompt,
          n: 1,
          size: "1024x1024",
          model: "dall-e-3",
          quality: "hd",
          response_format: "url",
          style: photoData.style || "vivid"
        },
        {
          ...openaiConfig,
          headers: {
            ...openaiConfig.headers,
            'OpenAI-Async': 'true',
            'OpenAI-Webhook-Url': `${BASE_URL}/webhooks/openai/fashion/${photo_id}`
          }
        }
      );
      
      return { photo_id, status: 'processing' };
    } catch (aiError) {
      await axios.put(
        `${BASE_URL}/fashion-photos/${photo_id}`,
        { status: 'failed', error_message: aiError.message },
        getAuthConfig()
      );
      throw aiError;
    }
  } catch (error) {
    console.error("Erro ao gerar foto fashion:", error);
    throw error;
  }
};

export const checkPhotoStatus = async (photoId) => {
  try {
    const response = await axios.get(
      `${BASE_URL}/fashion-photos/${photoId}/status`,
      getAuthConfig()
    );
    return response.data;
  } catch (error) {
    console.error("Erro ao verificar status da foto:", error);
    throw error;
  }
};

export const listUserPhotos = async (limit = 20) => {
  try {
    const response = await axios.get(
      `${BASE_URL}/fashion-photos`,
      { ...getAuthConfig(), params: { limit } }
    );
    return response.data;
  } catch (error) {
    console.error("Erro ao listar fotos do usuário:", error);
    throw error;
  }
};

export const deletePhoto = async (photoId) => {
  try {
    const response = await axios.delete(
      `${BASE_URL}/fashion-photos/${photoId}`,
      getAuthConfig()
    );
    return response.data;
  } catch (error) {
    console.error("Erro ao excluir foto:", error);
    throw error;
  }
};

export const getOutfitStyles = async () => {
  try {
    const response = await axios.get(
      `${BASE_URL}/fashion-photos/styles`,
      getAuthConfig()
    );
    return response.data;
  } catch (error) {
    console.error("Erro ao obter estilos de roupa:", error);
    throw error;
  }
};

export const getBackgrounds = async () => {
  try {
    const response = await axios.get(
      `${BASE_URL}/fashion-photos/backgrounds`,
      getAuthConfig()
    );
    return response.data;
  } catch (error) {
    console.error("Erro ao obter fundos disponíveis:", error);
    throw error;
  }
};

// Funções auxiliares
const durationToSeconds = (duration) => {
  const durationMap = {
    '5sec': 5,
    '10sec': 10,
    '15sec': 15,
    '30sec': 30
  };
  return durationMap[duration] || 5;
};

const mapStyleToPreset = (style) => {
  const styleMap = {
    'cinematic': 'cinematic',
    'cartoon': 'animation',
    'realistic': 'photographic',
    'artistic': 'creative',
    'fantasy': 'fantasy'
  };
  return styleMap[style] || 'cinematic';
};

const buildFashionPrompt = (photoData) => {
  const { outfit, background, model, pose, style } = photoData;
  
  let prompt = `High-quality fashion photography of ${model || 'a model'} wearing ${outfit}`;
  
  if (background) {
    prompt += ` with ${background} background`;
  }
  
  if (pose) {
    prompt += `, ${pose} pose`;
  }
  
  if (style) {
    prompt += `. Style: ${style}`;
  }
  
  // Adiciona detalhes técnicos para melhorar a qualidade
  prompt += `. Professional lighting, high resolution, photorealistic, detailed fabric texture.`;
  
  return prompt;
}; 