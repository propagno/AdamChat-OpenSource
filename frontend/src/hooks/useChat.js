import { useState, useEffect, useCallback } from 'react';
import chatApi from '../api/chat.api';
import { useAuth } from './useAuth';

/**
 * Hook personalizado para gerenciar interações de chat
 * Encapsula lógica de mensagens, histórico e interação com IA
 */
const useChat = () => {
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [conversationId, setConversationId] = useState(null);
  const [conversationTitle, setConversationTitle] = useState('Nova Conversa');
  const [conversations, setConversations] = useState([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  
  const { isAuthenticated } = useAuth();
  
  // Carregar conversas salvas quando o usuário estiver autenticado
  useEffect(() => {
    if (isAuthenticated) {
      loadConversations();
    }
  }, [isAuthenticated]);
  
  // Carregar lista de conversas
  const loadConversations = useCallback(async () => {
    setIsLoadingHistory(true);
    setError(null);
    
    try {
      const response = await chatApi.getConversations();
      setConversations(response.data || []);
    } catch (err) {
      console.error('Erro ao carregar histórico de conversas:', err);
      setError('Não foi possível carregar o histórico de conversas.');
    } finally {
      setIsLoadingHistory(false);
    }
  }, []);
  
  // Carregar uma conversa específica
  const loadConversation = useCallback(async (id) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await chatApi.getConversation(id);
      setMessages(response.data.messages || []);
      setConversationTitle(response.data.title || 'Conversa');
      setConversationId(id);
    } catch (err) {
      console.error('Erro ao carregar conversa:', err);
      setError('Não foi possível carregar esta conversa.');
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  // Enviar uma mensagem
  const sendMessage = useCallback(async (message, provider = 'default', agent = null) => {
    setIsLoading(true);
    setError(null);
    
    // Adicionar mensagem do usuário imediatamente
    const userMessage = {
      id: Date.now().toString(),
      content: message,
      role: 'user',
      timestamp: new Date().toISOString(),
    };
    
    // Precisamos fazer uma cópia das mensagens para evitar problemas de estado
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    
    try {
      // Preparar histórico para API no formato correto
      const history = updatedMessages.map(msg => ({
        role: msg.role,
        content: msg.content
      }));
      
      // Enviar para API
      const response = await chatApi.sendMessage(message, history, provider, agent);
      
      // Adicionar resposta da IA
      const aiResponse = {
        id: (Date.now() + 1).toString(),
        content: response.data.response || 'Desculpe, não consegui gerar uma resposta.',
        role: 'assistant',
        timestamp: new Date().toISOString(),
      };
      
      setMessages([...updatedMessages, aiResponse]);
      
      // Se for uma nova conversa, poderíamos definir um título automático
      if (!conversationId && updatedMessages.length <= 2) {
        // Código para gerar título automaticamente poderia ser adicionado aqui
      }
      
      return aiResponse;
    } catch (err) {
      console.error('Erro ao enviar mensagem:', err);
      setError('Não foi possível enviar a mensagem. Tente novamente mais tarde.');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [messages, conversationId]);
  
  // Salvar conversa atual
  const saveConversation = useCallback(async (title) => {
    if (!isAuthenticated) {
      setError('Você precisa estar autenticado para salvar conversas.');
      return { success: false, error: 'Autenticação necessária' };
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await chatApi.saveConversation(title, messages);
      
      // Atualizar ID e título da conversa atual
      setConversationId(response.data.id);
      setConversationTitle(title);
      
      // Recarregar lista de conversas
      await loadConversations();
      
      return { success: true, conversationId: response.data.id };
    } catch (err) {
      console.error('Erro ao salvar conversa:', err);
      setError('Não foi possível salvar a conversa.');
      return { success: false, error: err.message };
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, messages, loadConversations]);
  
  // Atualizar título da conversa
  const updateTitle = useCallback(async (title) => {
    if (!conversationId) {
      return { success: false, error: 'Nenhuma conversa selecionada' };
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      await chatApi.updateConversationTitle(conversationId, title);
      setConversationTitle(title);
      
      // Recarregar lista de conversas
      await loadConversations();
      
      return { success: true };
    } catch (err) {
      console.error('Erro ao atualizar título:', err);
      setError('Não foi possível atualizar o título da conversa.');
      return { success: false, error: err.message };
    } finally {
      setIsLoading(false);
    }
  }, [conversationId, loadConversations]);
  
  // Excluir conversa
  const deleteConversation = useCallback(async (id) => {
    setIsLoading(true);
    setError(null);
    
    try {
      await chatApi.deleteConversation(id);
      
      // Se a conversa excluída for a atual, limpar o estado
      if (id === conversationId) {
        setMessages([]);
        setConversationId(null);
        setConversationTitle('Nova Conversa');
      }
      
      // Recarregar lista de conversas
      await loadConversations();
      
      return { success: true };
    } catch (err) {
      console.error('Erro ao excluir conversa:', err);
      setError('Não foi possível excluir a conversa.');
      return { success: false, error: err.message };
    } finally {
      setIsLoading(false);
    }
  }, [conversationId, loadConversations]);
  
  // Iniciar nova conversa
  const newConversation = useCallback(() => {
    setMessages([]);
    setConversationId(null);
    setConversationTitle('Nova Conversa');
    setError(null);
  }, []);
  
  // Avaliar resposta da IA
  const rateMessage = useCallback(async (messageId, isHelpful, feedback = '') => {
    setIsLoading(true);
    
    try {
      await chatApi.rateResponse(messageId, isHelpful, feedback);
      return { success: true };
    } catch (err) {
      console.error('Erro ao avaliar mensagem:', err);
      return { success: false, error: err.message };
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  return {
    messages,
    isLoading,
    error,
    conversationId,
    conversationTitle,
    conversations,
    isLoadingHistory,
    sendMessage,
    loadConversation,
    saveConversation,
    updateTitle,
    deleteConversation,
    newConversation,
    rateMessage,
  };
};

export default useChat; 