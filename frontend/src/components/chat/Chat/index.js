// src/components/Chat.js
import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  Box,
  Paper,
  TextField,
  IconButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Fade,
  CircularProgress,
  Snackbar,
  Alert,
  Typography,
  Avatar,
  Button,
  Tooltip,
  Divider,
  Chip,
  useTheme,
  Card,
  CardContent,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Backdrop
} from '@mui/material';
import { styled } from '@mui/system';
import { useKeycloak } from '@react-keycloak/web';
import {
  Send as SendIcon,
  Settings as SettingsIcon,
  ContentCopy as ContentCopyIcon,
  Person as PersonIcon,
  SmartToy as BotIcon,
  MoreVert as MoreIcon,
  Refresh as RefreshIcon,
  ArrowDropDown as ArrowDropDownIcon,
  FormatClear as ClearIcon,
  Delete as DeleteIcon,
  History as HistoryIcon,
  Lightbulb as LightbulbIcon,
  Close as CloseIcon,
  Done as DoneIcon
} from '@mui/icons-material';
import Navbar from './Navbar';
import chatApi from '../../../api/chat.api';
import Sidebar from './Sidebar';
import { useAuth } from '../../../contexts/AuthContext';

// Componente estilizado para o balão de mensagem do usuário
const UserMessageBubble = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(2),
  borderRadius: theme.spacing(2),
  backgroundColor: '#2e67d2',
  backgroundImage: 'linear-gradient(to right, #2e67d2, #4e7ae3)',
  color: '#fff',
  maxWidth: '80%',
  alignSelf: 'flex-end',
  boxShadow: '0 2px 10px rgba(46, 103, 210, 0.2)',
  position: 'relative',
  '&:after': {
    content: '""',
    position: 'absolute',
    right: '15px',
    bottom: '-10px',
    border: '10px solid transparent',
    borderTopColor: '#4e7ae3',
    borderRight: 0,
    marginLeft: '-10px',
  },
}));

// Componente estilizado para o balão de mensagem do AI
const AIMessageBubble = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(2),
  borderRadius: theme.spacing(2),
  backgroundColor: theme.palette.mode === 'dark' ? '#2d2d3d' : '#f9f9fc',
  color: theme.palette.mode === 'dark' ? '#e3e3e5' : '#1f1f27',
  maxWidth: '80%',
  alignSelf: 'flex-start',
  boxShadow: '0 2px 10px rgba(0, 0, 0, 0.08)',
  position: 'relative',
  '&:after': {
    content: '""',
    position: 'absolute',
    left: '15px',
    bottom: '-10px',
    border: '10px solid transparent',
    borderTopColor: theme.palette.mode === 'dark' ? '#2d2d3d' : '#f9f9fc',
    borderLeft: 0,
    marginRight: '-10px',
  },
}));

// Componente para a área de código
const CodeBlock = ({ language, value }) => {
  const [copied, setCopied] = useState(false);
  const timeoutRef = useRef(null);

  const copyToClipboard = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    navigator.clipboard.writeText(value);
    setCopied(true);
    timeoutRef.current = setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Box sx={{ position: 'relative', my: 2 }}>
      <Box 
        sx={{ 
          bgcolor: 'background.paper', 
          color: 'text.primary',
          p: 2, 
          borderRadius: 1,
          fontFamily: 'monospace',
          fontSize: '0.875rem',
          overflow: 'auto',
          '&::-webkit-scrollbar': {
            height: '8px',
            width: '8px',
          },
          '&::-webkit-scrollbar-thumb': {
            backgroundColor: 'rgba(0,0,0,0.2)',
            borderRadius: '4px',
          },
          border: '1px solid',
          borderColor: 'divider',
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
        }}
      >
        {value}
      </Box>
      <IconButton
        onClick={copyToClipboard}
        size="small"
        sx={{
          position: 'absolute',
          top: 8,
          right: 8,
          color: copied ? 'success.main' : 'text.secondary',
          bgcolor: 'background.paper',
          '&:hover': {
            bgcolor: 'action.hover',
          },
          boxShadow: 1
        }}
      >
        {copied ? <DoneIcon fontSize="small" /> : <ContentCopyIcon fontSize="small" />}
      </IconButton>
    </Box>
  );
};

// Componente principal do chat
const Chat = () => {
  const { user } = useAuth();
  const theme = useTheme();
  const chatEndRef = useRef(null);
  const messageInputRef = useRef(null);

  // Estado para mensagens e configurações
  const [message, setMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [history, setHistory] = useState([]);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });
  
  // Estado para conversas
  const [conversations, setConversations] = useState([]);
  const [currentConversationId, setCurrentConversationId] = useState(null);
  
  // Estado para configurações de IA
  const [providers, setProviders] = useState([]);
  const [selectedProvider, setSelectedProvider] = useState(null);
  const [providerVersions, setProviderVersions] = useState([]);
  const [selectedVersion, setSelectedVersion] = useState('');
  const [maxTokens, setMaxTokens] = useState(2048);
  const [temperature, setTemperature] = useState(0.7);

  // Carregar conversas e configurações ao iniciar
  useEffect(() => {
    if (user && user.id) {
      loadUserSettings();
      loadConversations();
      loadProviders();
    }
  }, [user]);

  // Scroll para o final do chat quando novas mensagens são adicionadas
  useEffect(() => {
    scrollToBottom();
  }, [history, isTyping]);

  // Carregar configurações do usuário
  const loadUserSettings = async () => {
    try {
      const settings = await chatApi.getUserSettings(user.id);
      if (settings) {
        setMaxTokens(settings.maxTokens || 2048);
        setTemperature(settings.temperature || 0.7);
        
        if (settings.provider) {
          setSelectedProvider(settings.provider);
        }
        
        if (settings.model) {
          setSelectedVersion(settings.model);
        }
      }
    } catch (error) {
      console.error('Erro ao carregar configurações:', error);
    }
  };

  // Carregar conversas do usuário
  const loadConversations = async () => {
    try {
      const result = await chatApi.getConversations(user.id);
      setConversations(result || []);
      
      // Se tiver conversas, seleciona a mais recente
      if (result && result.length > 0) {
        const mostRecent = result.sort((a, b) => 
          new Date(b.updatedAt) - new Date(a.updatedAt)
        )[0];
        
        setCurrentConversationId(mostRecent.id);
        loadMessages(mostRecent.id);
      }
    } catch (error) {
      console.error('Erro ao carregar conversas:', error);
      setSnackbar({
        open: true,
        message: 'Erro ao carregar conversas. Tente novamente.',
        severity: 'error'
      });
    }
  };

  // Carregar provedores de IA
  const loadProviders = async () => {
    try {
      const result = await chatApi.getProviders();
      setProviders(result || []);
      
      // Se tiver provedores e nenhum selecionado, seleciona o primeiro
      if (result && result.length > 0 && !selectedProvider) {
        setSelectedProvider(result[0]);
        
        // Para cada provedor, define as versões disponíveis
        if (result[0].models && result[0].models.length > 0) {
          setProviderVersions(result[0].models);
          setSelectedVersion(result[0].models[0]);
        }
      }
    } catch (error) {
      console.error('Erro ao carregar provedores:', error);
    }
  };

  // Carregar mensagens de uma conversa
  const loadMessages = async (conversationId) => {
    if (!conversationId) return;
    
    try {
      const result = await chatApi.getMessages(conversationId);
      
      if (result && Array.isArray(result)) {
        const formattedHistory = result.map(msg => ({
          id: msg.id,
          sender: msg.role === 'user' ? 'user' : 'ai',
          text: msg.content,
          timestamp: msg.createdAt
        }));
        
        setHistory(formattedHistory);
      } else {
        setHistory([]);
      }
    } catch (error) {
      console.error('Erro ao carregar mensagens:', error);
      setSnackbar({
        open: true,
        message: 'Erro ao carregar mensagens. Tente novamente.',
        severity: 'error'
      });
    }
  };

  // Criar nova conversa
  const createNewConversation = async () => {
    try {
      const title = 'Nova Conversa';
      const result = await chatApi.createConversation(user.id, title);
      
      if (result && result.id) {
        setConversations(prev => [result, ...prev]);
        setCurrentConversationId(result.id);
        setHistory([]);
      }
    } catch (error) {
      console.error('Erro ao criar conversa:', error);
      setSnackbar({
        open: true,
        message: 'Erro ao criar conversa. Tente novamente.',
        severity: 'error'
      });
    }
  };

  // Excluir conversa atual
  const deleteCurrentConversation = async (conversationId) => {
    if (!conversationId) return;
    
    try {
      await chatApi.deleteConversation(conversationId);
      
      // Atualiza lista de conversas
      setConversations(prev => prev.filter(c => c.id !== conversationId));
      
      // Se a conversa excluída for a atual, limpa o histórico e seleciona outra
      if (conversationId === currentConversationId) {
        setHistory([]);
        
        // Seleciona a próxima conversa, se houver
        const remainingConversations = conversations.filter(c => c.id !== conversationId);
        if (remainingConversations.length > 0) {
          setCurrentConversationId(remainingConversations[0].id);
          loadMessages(remainingConversations[0].id);
        } else {
          setCurrentConversationId(null);
        }
      }
      
      setSnackbar({
        open: true,
        message: 'Conversa excluída com sucesso!',
        severity: 'success'
      });
    } catch (error) {
      console.error('Erro ao excluir conversa:', error);
      setSnackbar({
        open: true,
        message: 'Erro ao excluir conversa. Tente novamente.',
        severity: 'error'
      });
    }
  };

  // Atualizar título da conversa
  const updateConversationTitle = async (conversationId, newTitle) => {
    if (!conversationId || !newTitle) return;
    
    try {
      const result = await chatApi.updateConversation(conversationId, newTitle);
      
      // Atualiza lista de conversas
      setConversations(prev => prev.map(c => 
        c.id === conversationId ? { ...c, title: newTitle } : c
      ));
      
      setSnackbar({
        open: true,
        message: 'Título atualizado com sucesso!',
        severity: 'success'
      });
    } catch (error) {
      console.error('Erro ao atualizar título:', error);
      setSnackbar({
        open: true,
        message: 'Erro ao atualizar título. Tente novamente.',
        severity: 'error'
      });
    }
  };

  // Limpar mensagens da conversa atual
  const clearChat = async () => {
    if (!currentConversationId) return;
    
    try {
      await chatApi.clearMessages(currentConversationId);
      setHistory([]);
      
      setSnackbar({
        open: true,
        message: 'Mensagens apagadas com sucesso!',
        severity: 'success'
      });
    } catch (error) {
      console.error('Erro ao limpar mensagens:', error);
      setSnackbar({
        open: true,
        message: 'Erro ao limpar mensagens. Tente novamente.',
        severity: 'error'
      });
    }
  };

  // Salvar configurações do usuário
  const saveUserSettings = async () => {
    if (!user.id) return;
    
    try {
      const settings = {
        provider: selectedProvider?.id,
        model: selectedVersion,
        maxTokens,
        temperature
      };
      
      await chatApi.saveUserSettings(user.id, settings);
      
      setSnackbar({
        open: true,
        message: 'Configurações salvas com sucesso!',
        severity: 'success'
      });
    } catch (error) {
      console.error('Erro ao salvar configurações:', error);
      setSnackbar({
        open: true,
        message: 'Erro ao salvar configurações. Tente novamente.',
        severity: 'error'
      });
    }
  };

  // Enviar mensagem
  const sendMessage = async () => {
    if (!message.trim() || isTyping || !currentConversationId) return;
    
    // Se não tiver conversa atual, cria uma nova
    if (!currentConversationId) {
      await createNewConversation();
    }
    
    const userMessage = {
      sender: 'user',
      text: message.trim(),
      timestamp: new Date().toISOString()
    };
    
    // Adiciona mensagem do usuário ao histórico
    setHistory(prev => [...prev, userMessage]);
    setMessage('');
    setIsTyping(true);
    
    try {
      // Prepara os parâmetros para a API
      const params = {
        provider: selectedProvider?.name || 'openai',
        model: selectedVersion || 'gpt-3.5-turbo',
        maxTokens,
        temperature
      };
      
      // Envia a mensagem para a API
      const response = await chatApi.sendMessage(
        user.id,
        currentConversationId,
        message.trim(),
        params
      );
      
      // Adiciona resposta da IA ao histórico
      if (response) {
        const aiMessage = {
          sender: 'ai',
          text: response.content || "Desculpe, ocorreu um erro ao processar sua solicitação.",
          timestamp: new Date().toISOString()
        };
        
        setHistory(prev => [...prev, aiMessage]);
      }
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
      setSnackbar({
        open: true,
        message: 'Erro ao enviar mensagem. Tente novamente.',
        severity: 'error'
      });
    } finally {
      setIsTyping(false);
    }
  };

  // Sugerir uma pergunta
  const useSuggestion = (suggestionText) => {
    setMessage(suggestionText);
    messageInputRef.current?.focus();
  };

  // Lidar com tecla Enter para enviar mensagem
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Fechar snackbar
  const handleCloseSnackbar = (event, reason) => {
    if (reason === 'clickaway') return;
    setSnackbar({ ...snackbar, open: false });
  };

  // Formatar timestamp em horário legível
  const formatTimestamp = (timestamp) => {
    if (!timestamp) return '';
    
    try {
      const date = new Date(timestamp);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch (e) {
      return '';
    }
  };

  // Scroll para o final do chat
  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <Box sx={{ 
      display: 'flex', 
      flexDirection: 'column', 
      height: 'calc(100vh - 64px)',
      bgcolor: theme.palette.mode === 'dark' ? '#1a1a2e' : '#f0f2f5',
    }}>
      <Box sx={{ display: 'flex', height: '100%' }}>
        {/* Sidebar */}
        <Sidebar 
          conversations={conversations}
          currentConversationId={currentConversationId}
          onConversationSelect={(id) => {
            setCurrentConversationId(id);
            loadMessages(id);
          }}
          onNewConversation={createNewConversation}
          onDeleteConversation={deleteCurrentConversation}
          onClearMessages={clearChat}
          onRenameConversation={updateConversationTitle}
          providers={providers}
          selectedProvider={selectedProvider}
          onProviderChange={setSelectedProvider}
          providerVersions={providerVersions}
          selectedVersion={selectedVersion}
          onVersionChange={setSelectedVersion}
          maxTokens={maxTokens}
          onMaxTokensChange={setMaxTokens}
          temperature={temperature}
          onTemperatureChange={setTemperature}
          onSaveSettings={saveUserSettings}
        />

        {/* Área principal do chat */}
        <Box sx={{ 
          flex: 1, 
          display: 'flex', 
          flexDirection: 'column',
          height: '100%',
          position: 'relative'
        }}>
          {/* Cabeçalho */}
          <Box sx={{ 
            p: 2, 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            borderBottom: '1px solid',
            borderColor: 'divider',
            bgcolor: theme.palette.mode === 'dark' ? '#242442' : '#ffffff',
          }}>
            <Typography variant="h6">
              {conversations.find(c => c.id === currentConversationId)?.title || 'Nova Conversa'}
            </Typography>
            <Box>
              <Tooltip title="Limpar Chat">
                <IconButton onClick={clearChat}>
                  <ClearIcon />
                </IconButton>
              </Tooltip>
            </Box>
          </Box>

          {/* Histórico do chat */}
          <Box sx={{ 
            flex: 1, 
            overflow: 'auto', 
            p: 3,
            display: 'flex',
            flexDirection: 'column',
            gap: 2,
            bgcolor: theme.palette.mode === 'dark' ? '#1a1a2e' : '#f0f2f5',
          }}>
            {history.length === 0 ? (
              <Box sx={{ 
                height: '100%', 
                display: 'flex', 
                flexDirection: 'column', 
                justifyContent: 'center', 
                alignItems: 'center',
                opacity: 0.7,
                gap: 2
              }}>
                <LightbulbIcon sx={{ fontSize: 60, opacity: 0.4 }} />
                <Typography variant="h6" color="text.secondary">
                  Comece uma nova conversa
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 1, maxWidth: 600 }}>
                  <Button 
                    variant="outlined" 
                    size="small"
                    onClick={() => useSuggestion("O que é inteligência artificial?")}
                  >
                    O que é inteligência artificial?
                  </Button>
                  <Button 
                    variant="outlined" 
                    size="small"
                    onClick={() => useSuggestion("Explique os conceitos básicos de Machine Learning")}
                  >
                    Conceitos de Machine Learning
                  </Button>
                  <Button 
                    variant="outlined" 
                    size="small"
                    onClick={() => useSuggestion("Quais são as aplicações de IA na medicina?")}
                  >
                    IA na medicina
                  </Button>
                </Box>
              </Box>
            ) : (
              <>
                {history.map((msg, index) => (
                  <Box
                    key={index}
                    sx={{
                      display: 'flex',
                      flexDirection: msg.sender === 'user' ? 'row-reverse' : 'row',
                      alignItems: 'flex-start',
                      gap: 1,
                    }}
                  >
                    <Avatar
                      sx={{
                        bgcolor: msg.sender === 'user' ? 'primary.main' : 'secondary.main',
                        width: 36,
                        height: 36,
                      }}
                    >
                      {msg.sender === 'user' ? <PersonIcon /> : <BotIcon />}
                    </Avatar>
                    
                    {msg.sender === 'user' ? (
                      <UserMessageBubble>
                        <Typography variant="body1">{msg.text}</Typography>
                        <Typography variant="caption" sx={{ display: 'block', textAlign: 'right', mt: 1, opacity: 0.7 }}>
                          {formatTimestamp(msg.timestamp)}
                        </Typography>
                      </UserMessageBubble>
                    ) : (
                      <AIMessageBubble>
                        <ReactMarkdown
                          children={msg.text}
                          remarkPlugins={[remarkGfm]}
                          components={{
                            code({ node, inline, className, children, ...props }) {
                              const match = /language-(\w+)/.exec(className || '');
                              return !inline ? (
                                <CodeBlock
                                  language={match ? match[1] : ''}
                                  value={String(children).replace(/\n$/, '')}
                                  {...props}
                                />
                              ) : (
                                <code className={className} {...props}>
                                  {children}
                                </code>
                              );
                            },
                          }}
                        />
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1 }}>
                          <Box sx={{ display: 'flex', gap: 1 }}>
                            <Tooltip title="Copiar resposta">
                              <IconButton size="small" onClick={() => {
                                navigator.clipboard.writeText(msg.text);
                                setSnackbar({ open: true, message: "Copiado para a área de transferência", severity: 'success' });
                              }}>
                                <ContentCopyIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </Box>
                          <Typography variant="caption" sx={{ opacity: 0.7 }}>
                            {formatTimestamp(msg.timestamp)}
                          </Typography>
                        </Box>
                      </AIMessageBubble>
                    )}
                  </Box>
                ))}

                {isTyping && (
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: 1,
                    }}
                  >
                    <Avatar
                      sx={{
                        bgcolor: 'secondary.main',
                        width: 36,
                        height: 36,
                      }}
                    >
                      <BotIcon />
                    </Avatar>
                    <AIMessageBubble>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <CircularProgress size={16} />
                        <Typography>Digitando...</Typography>
                      </Box>
                    </AIMessageBubble>
                  </Box>
                )}
                <div ref={chatEndRef} />
              </>
            )}
          </Box>

          {/* Área de input */}
          <Box sx={{ 
            p: 2, 
            borderTop: '1px solid', 
            borderColor: 'divider',
            bgcolor: theme.palette.mode === 'dark' ? '#242442' : '#ffffff',
          }}>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <TextField
                fullWidth
                variant="outlined"
                placeholder="Digite sua mensagem..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                multiline
                maxRows={4}
                inputRef={messageInputRef}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <Tooltip title="Enviar">
                        <IconButton 
                          color="primary" 
                          onClick={() => sendMessage()}
                          disabled={isTyping || !message.trim()}
                        >
                          <SendIcon />
                        </IconButton>
                      </Tooltip>
                    </InputAdornment>
                  ),
                }}
              />
            </Box>
          </Box>
        </Box>
      </Box>

      <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={handleCloseSnackbar}>
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Chat;
