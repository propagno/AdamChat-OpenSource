// src/components/Chat.js
import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
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
import { useAuth } from '../contexts/AuthContext';
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
import Navbar from '../components/Navbar';

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
  const theme = useTheme();
  const { user } = useAuth();
  const [message, setMessage] = useState("");
  const [history, setHistory] = useState([]);
  const [agents, setAgents] = useState([]);
  const [selectedAgent, setSelectedAgent] = useState(null);
  const [providers, setProviders] = useState([]);
  const [selectedProvider, setSelectedProvider] = useState(null);
  const [providerVersions, setProviderVersions] = useState([]);
  const [selectedVersion, setSelectedVersion] = useState("");
  const [loadingProviders, setLoadingProviders] = useState(false);
  const [loadingAgents, setLoadingAgents] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'error' });

  const chatEndRef = useRef(null);
  const messageInputRef = useRef(null);
  const user_id = user?.id || "usuario_exemplo";
  const user_email = user?.email || "usuario@example.com";
  const userName = user?.name || "Usuário";

  // Sugestões de inicialização do chat
  const chatSuggestions = [
    "Explique-me o que é diabetes tipo 2 e seus principais sintomas.",
    "Quais são os principais efeitos colaterais da medicação para hipertensão?",
    "Como posso melhorar minha alimentação para controlar a pressão arterial?",
    "Preciso de orientações sobre cuidados pré-natais no primeiro trimestre."
  ];

  // Carrega agents do backend
  useEffect(() => {
    const fetchAgents = async () => {
      setLoadingAgents(true);
      try {
        const response = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/agent`);
        setAgents(response.data);
        // Seleciona o primeiro agent como padrão, se houver
        if (response.data.length > 0) {
          setSelectedAgent(response.data[0]);
        }
      } catch (error) {
        console.error("Erro ao carregar agents:", error);
        setSnackbar({ open: true, message: "Erro ao carregar agents", severity: 'error' });
      }
      setLoadingAgents(false);
    };
    fetchAgents();
  }, []);

  // Carrega providers do backend
  useEffect(() => {
    const fetchProviders = async () => {
      setLoadingProviders(true);
      try {
        const response = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/providers`);
        setProviders(response.data);
        if (response.data.length > 0) {
          setSelectedProvider(response.data[0]);
          if (response.data[0].versions) {
            const versionKeys = Object.keys(response.data[0].versions);
            setProviderVersions(versionKeys);
            setSelectedVersion(versionKeys[0]);
          }
        }
      } catch (error) {
        console.error("Erro ao carregar providers:", error);
        setSnackbar({ open: true, message: "Erro ao carregar providers", severity: 'error' });
      }
      setLoadingProviders(false);
    };
    fetchProviders();
  }, []);

  // Atualiza as versões disponíveis quando o provider selecionado muda
  useEffect(() => {
    if (selectedProvider && selectedProvider.versions) {
      const versionKeys = Object.keys(selectedProvider.versions);
      setProviderVersions(versionKeys);
      setSelectedVersion(versionKeys[0]);
    } else {
      setProviderVersions([]);
      setSelectedVersion("");
    }
  }, [selectedProvider]);

  const sendMessage = async (text = message) => {
    const messageToSend = text.trim();
    if (messageToSend === "") return;

    const endpoint = `${process.env.REACT_APP_BACKEND_URL}/chat`;
    const payload = {
      user_id,
      user_email,
      message: messageToSend,
      agent: selectedAgent ? selectedAgent.name.toLowerCase() : "",
      gptProvider: selectedProvider ? selectedProvider.name.toLowerCase() : "",
      providerVersion: selectedVersion,
      userMsgId: `msg-${Date.now()}`
    };

    // Atualiza o histórico localmente antes de enviar
    setHistory(prev => [...prev, { sender: "user", text: messageToSend, timestamp: new Date().toISOString() }]);
    setMessage("");
    setIsTyping(true);

    try {
      const response = await axios.post(endpoint, payload);
      setIsTyping(false);
      // Se a API retorna um histórico completo, use-o
      if (Array.isArray(response.data.history)) {
        setHistory(response.data.history);
      } else {
        // Senão, adicione apenas a resposta ao histórico existente
        setHistory(prev => [...prev, { 
          sender: "ai", 
          text: response.data.response || "Não foi possível obter uma resposta válida.",
          timestamp: new Date().toISOString()
        }]);
      }
    } catch (error) {
      console.error("Erro ao enviar mensagem:", error);
      setIsTyping(false);
      setSnackbar({ open: true, message: "Erro ao enviar mensagem", severity: 'error' });
    }
  };

  const handleSuggestion = (suggestion) => {
    sendMessage(suggestion);
  };

  // Envia a mensagem ao pressionar Enter
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const clearChat = () => {
    setHistory([]);
    if (messageInputRef.current) {
      messageInputRef.current.focus();
    }
  };

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [history, isTyping]);

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <Box sx={{ 
      display: 'flex', 
      flexDirection: 'column', 
      height: 'calc(100vh - 64px)',
      bgcolor: theme.palette.mode === 'dark' ? '#1a1a2e' : '#f0f2f5',
    }}>
      <Navbar />

      {/* Cabeçalho */}
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        px: 3, 
        py: 1.5, 
        borderBottom: '1px solid',
        borderColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)',
        bgcolor: theme.palette.mode === 'dark' ? '#16162c' : '#ffffff',
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Avatar 
            sx={{ 
              bgcolor: theme.palette.primary.main,
              width: 36, 
              height: 36,
              mr: 1.5
            }}
          >
            {selectedAgent?.name?.charAt(0) || 'A'}
          </Avatar>
          <Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
              {selectedAgent?.name || 'Assistente Médico'}
            </Typography>
            <Chip 
              size="small" 
              label={selectedProvider?.name || 'AI Provider'} 
              sx={{ 
                height: 20, 
                fontSize: '0.65rem',
                bgcolor: theme.palette.mode === 'dark' ? 'rgba(66, 153, 225, 0.2)' : 'rgba(66, 153, 225, 0.1)',
                color: theme.palette.mode === 'dark' ? '#90cdf4' : '#2b6cb0'
              }} 
            />
          </Box>
        </Box>
        
        <Box>
          <Tooltip title="Configurações do Chat">
            <IconButton onClick={() => setSettingsOpen(true)}>
              <SettingsIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Limpar Conversa">
            <IconButton onClick={clearChat} color="error">
              <ClearIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* Histórico de Mensagens */}
      <Box
        sx={{
          flexGrow: 1,
          overflowY: 'auto',
          px: { xs: 2, md: 4 },
          py: 3,
          display: 'flex',
          flexDirection: 'column',
          gap: 3,
          bgcolor: theme.palette.mode === 'dark' ? '#1a1a2e' : '#f0f2f5',
          backgroundImage: theme.palette.mode === 'dark' 
            ? 'radial-gradient(circle at 25% 25%, rgba(53, 53, 102, 0.2) 0%, transparent 50%), radial-gradient(circle at 75% 75%, rgba(53, 53, 102, 0.2) 0%, transparent 50%)'
            : 'radial-gradient(circle at 25% 25%, rgba(66, 153, 225, 0.1) 0%, transparent 50%), radial-gradient(circle at 75% 75%, rgba(66, 153, 225, 0.1) 0%, transparent 50%)',
        }}
      >
        {history.length === 0 ? (
          <Box sx={{ 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center', 
            justifyContent: 'center', 
            height: '100%', 
            opacity: 0.8 
          }}>
            <LightbulbIcon sx={{ fontSize: 60, color: theme.palette.primary.main, mb: 2, opacity: 0.6 }} />
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 'medium', color: theme.palette.mode === 'dark' ? '#e3e3e5' : '#4a5568' }}>
              Comece uma nova conversa
            </Typography>
            <Typography variant="body2" sx={{ mb: 4, color: theme.palette.mode === 'dark' ? '#a0aec0' : '#718096', textAlign: 'center', maxWidth: '400px' }}>
              Faça perguntas sobre saúde, medicamentos, ou peça orientações sobre cuidados médicos.
            </Typography>
            
            <Box sx={{ width: '100%', maxWidth: '600px' }}>
              <Typography variant="subtitle2" sx={{ mb: 1, color: theme.palette.mode === 'dark' ? '#e2e8f0' : '#4a5568' }}>
                Sugestões para começar:
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {chatSuggestions.map((suggestion, index) => (
                  <Button 
                    key={index}
                    variant="outlined"
                    size="small"
                    onClick={() => handleSuggestion(suggestion)}
                    sx={{ 
                      justifyContent: 'flex-start',
                      textTransform: 'none',
                      fontWeight: 'normal',
                      px: 2,
                      py: 1,
                      borderRadius: 2,
                      color: theme.palette.mode === 'dark' ? '#e2e8f0' : '#2d3748',
                      borderColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.12)',
                      '&:hover': {
                        bgcolor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)',
                        borderColor: theme.palette.primary.main
                      },
                      transition: 'all 0.2s'
                    }}
                  >
                    {suggestion}
                  </Button>
                ))}
              </Box>
            </Box>
          </Box>
        ) : (
          history.map((entry, index) => (
            <Box 
              key={index} 
              sx={{ 
                display: 'flex',
                alignItems: 'flex-start',
                gap: 1.5,
                maxWidth: '90%',
                alignSelf: entry.sender === "user" ? 'flex-end' : 'flex-start'
              }}
            >
              {entry.sender !== "user" && (
                <Avatar 
                  sx={{ 
                    bgcolor: theme.palette.primary.main, 
                    width: 32, 
                    height: 32,
                    mt: 0.5
                  }}
                >
                  <BotIcon fontSize="small" />
                </Avatar>
              )}
              
              <Box sx={{ display: 'flex', flexDirection: 'column', maxWidth: 'calc(100% - 48px)' }}>
                <Typography 
                  variant="caption" 
                  sx={{ 
                    mb: 0.5, 
                    color: theme.palette.text.secondary,
                    alignSelf: entry.sender === "user" ? 'flex-end' : 'flex-start'
                  }}
                >
                  {entry.sender === "user" ? userName : selectedAgent?.name || 'Assistente'} • {formatTimestamp(entry.timestamp)}
                </Typography>
                
                {entry.sender === "user" ? (
                  <UserMessageBubble>
                    <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                      {entry.text}
                    </Typography>
                  </UserMessageBubble>
                ) : (
                  <AIMessageBubble>
                    <ReactMarkdown
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
                            <code 
                              className={className} 
                              style={{ 
                                backgroundColor: 'rgba(0, 0, 0, 0.05)', 
                                padding: '0.2em 0.4em', 
                                borderRadius: '3px',
                                fontFamily: 'monospace'
                              }} 
                              {...props}
                            >
                              {children}
                            </code>
                          );
                        },
                        p: ({ node, ...props }) => (
                          <Typography 
                            variant="body1" 
                            component="p" 
                            sx={{ mb: 1.5 }}
                            {...props} 
                          />
                        ),
                        h1: ({ node, ...props }) => (
                          <Typography 
                            variant="h5" 
                            component="h1" 
                            sx={{ 
                              fontWeight: 600, 
                              my: 2,
                              borderBottom: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
                              pb: 1
                            }}
                            {...props} 
                          />
                        ),
                        h2: ({ node, ...props }) => (
                          <Typography 
                            variant="h6" 
                            component="h2" 
                            sx={{ 
                              fontWeight: 600, 
                              my: 1.5 
                            }}
                            {...props} 
                          />
                        ),
                        h3: ({ node, ...props }) => (
                          <Typography 
                            variant="subtitle1" 
                            component="h3" 
                            sx={{ 
                              fontWeight: 600, 
                              my: 1 
                            }}
                            {...props} 
                          />
                        ),
                        ul: ({ node, ...props }) => (
                          <Box component="ul" sx={{ pl: 3, mb: 2 }} {...props} />
                        ),
                        ol: ({ node, ...props }) => (
                          <Box component="ol" sx={{ pl: 3, mb: 2 }} {...props} />
                        ),
                        li: ({ node, ...props }) => (
                          <Box component="li" sx={{ mb: 0.5 }} {...props} />
                        ),
                        a: ({ node, ...props }) => (
                          <Typography 
                            component="a" 
                            sx={{ 
                              color: theme.palette.primary.main,
                              textDecoration: 'none',
                              '&:hover': {
                                textDecoration: 'underline'
                              }
                            }} 
                            {...props} 
                          />
                        ),
                        blockquote: ({ node, ...props }) => (
                          <Box 
                            component="blockquote" 
                            sx={{ 
                              borderLeft: '4px solid',
                              borderColor: theme.palette.primary.main,
                              pl: 2,
                              py: 0.5,
                              my: 2,
                              bgcolor: theme.palette.mode === 'dark' ? 'rgba(66, 153, 225, 0.1)' : 'rgba(66, 153, 225, 0.05)',
                              borderRadius: '4px'
                            }}
                            {...props} 
                          />
                        ),
                        table: ({ node, ...props }) => (
                          <Box 
                            sx={{ 
                              overflowX: 'auto', 
                              my: 2,
                              '& table': {
                                borderCollapse: 'collapse',
                                width: '100%',
                                '& th, & td': {
                                  border: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
                                  padding: '8px 12px',
                                  textAlign: 'left'
                                },
                                '& th': {
                                  backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)'
                                }
                              }
                            }}
                          >
                            <table {...props} />
                          </Box>
                        ),
                      }}
                    >
                      {entry.text}
                    </ReactMarkdown>
                  </AIMessageBubble>
                )}
              </Box>
              
              {entry.sender === "user" && (
                <Avatar 
                  sx={{ 
                    bgcolor: '#2e67d2',
                    width: 32, 
                    height: 32,
                    mt: 0.5
                  }}
                >
                  <PersonIcon fontSize="small" />
                </Avatar>
              )}
            </Box>
          ))
        )}
        
        {isTyping && (
          <Box 
            sx={{ 
              display: 'flex',
              alignItems: 'flex-start',
              gap: 1.5,
              maxWidth: '100%'
            }}
          >
            <Avatar 
              sx={{ 
                bgcolor: theme.palette.primary.main, 
                width: 32, 
                height: 32,
                mt: 0.5
              }}
            >
              <BotIcon fontSize="small" />
            </Avatar>
            
            <Box sx={{ display: 'flex', flexDirection: 'column' }}>
              <Typography 
                variant="caption" 
                sx={{ 
                  mb: 0.5, 
                  color: theme.palette.text.secondary
                }}
              >
                {selectedAgent?.name || 'Assistente'} está digitando...
              </Typography>
              
              <AIMessageBubble sx={{ p: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <Box sx={{ 
                    width: 8, 
                    height: 8, 
                    borderRadius: '50%', 
                    bgcolor: theme.palette.primary.main,
                    animation: 'pulse 1s infinite',
                    animationDelay: '0s',
                    '@keyframes pulse': {
                      '0%, 100%': {
                        opacity: 0.5,
                        transform: 'scale(0.8)'
                      },
                      '50%': {
                        opacity: 1,
                        transform: 'scale(1)'
                      }
                    }
                  }} />
                  <Box sx={{ 
                    width: 8, 
                    height: 8, 
                    borderRadius: '50%', 
                    bgcolor: theme.palette.primary.main,
                    animation: 'pulse 1s infinite',
                    animationDelay: '0.2s'
                  }} />
                  <Box sx={{ 
                    width: 8, 
                    height: 8, 
                    borderRadius: '50%', 
                    bgcolor: theme.palette.primary.main,
                    animation: 'pulse 1s infinite',
                    animationDelay: '0.4s'
                  }} />
                </Box>
              </AIMessageBubble>
            </Box>
          </Box>
        )}
        
        <div ref={chatEndRef} />
      </Box>

      {/* Campo de Entrada */}
      <Box sx={{ 
        p: 2, 
        borderTop: '1px solid',
        borderColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)',
        bgcolor: theme.palette.mode === 'dark' ? '#16162c' : '#ffffff',
      }}>
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'flex-end',
          gap: 1,
          position: 'relative',
          maxWidth: 1200,
          mx: 'auto'
        }}>
          <TextField
            fullWidth
            multiline
            maxRows={4}
            variant="outlined"
            placeholder="Digite sua mensagem..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            inputRef={messageInputRef}
            sx={{ 
              '& .MuiOutlinedInput-root': {
                borderRadius: '12px',
                bgcolor: theme.palette.mode === 'dark' ? '#262640' : '#f8f9fa',
                '& fieldset': {
                  borderColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)'
                },
                '&:hover fieldset': {
                  borderColor: theme.palette.primary.main
                },
                '&.Mui-focused fieldset': {
                  borderColor: theme.palette.primary.main
                }
              },
              '& .MuiInputBase-input': {
                py: 1.5,
                px: 2
              }
            }}
          />
          <IconButton 
            color="primary"
            disabled={!message.trim() || isTyping}
            onClick={() => sendMessage()}
            sx={{ 
              bgcolor: theme.palette.primary.main,
              color: 'white',
              '&:hover': {
                bgcolor: theme.palette.primary.dark,
              },
              '&.Mui-disabled': {
                bgcolor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.12)',
                color: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.26)'
              },
              width: 48,
              height: 48,
              transition: 'all 0.2s'
            }}
          >
            <SendIcon />
          </IconButton>
        </Box>
      </Box>

      {/* Drawer de configurações */}
      <Drawer
        anchor="right"
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        PaperProps={{
          sx: {
            width: { xs: '100%', sm: 350 },
            bgcolor: theme.palette.mode === 'dark' ? '#16162c' : '#ffffff',
          }
        }}
      >
        <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid', borderColor: 'divider' }}>
          <Typography variant="h6">Configurações do Chat</Typography>
          <IconButton onClick={() => setSettingsOpen(false)}>
            <CloseIcon />
          </IconButton>
        </Box>
        <Box sx={{ p: 3 }}>
          <Typography variant="subtitle2" gutterBottom>Agent</Typography>
          <FormControl fullWidth size="small" sx={{ mb: 3 }}>
            {loadingAgents ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', my: 2 }}>
                <CircularProgress size={24} />
              </Box>
            ) : (
              <Select
                value={selectedAgent ? selectedAgent.agent_id : ""}
                onChange={(e) => {
                  const agent = agents.find(a => a.agent_id === e.target.value);
                  setSelectedAgent(agent);
                }}
                displayEmpty
                renderValue={(selected) => {
                  if (!selected) {
                    return <Typography color="text.secondary">Selecione um agent</Typography>;
                  }
                  const agent = agents.find(a => a.agent_id === selected);
                  return agent?.name || "";
                }}
              >
                {agents.map((agent) => (
                  <MenuItem key={agent.agent_id} value={agent.agent_id}>
                    {agent.name}
                  </MenuItem>
                ))}
              </Select>
            )}
          </FormControl>

          <Typography variant="subtitle2" gutterBottom>Provedor de IA</Typography>
          <FormControl fullWidth size="small" sx={{ mb: 3 }}>
            {loadingProviders ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', my: 2 }}>
                <CircularProgress size={24} />
              </Box>
            ) : (
              <Select
                value={selectedProvider ? selectedProvider.name.toLowerCase() : ""}
                onChange={(e) => {
                  const prov = providers.find(p => p.name.toLowerCase() === e.target.value);
                  setSelectedProvider(prov);
                }}
                displayEmpty
                renderValue={(selected) => {
                  if (!selected) {
                    return <Typography color="text.secondary">Selecione um provedor</Typography>;
                  }
                  const provider = providers.find(p => p.name.toLowerCase() === selected);
                  return provider?.name || "";
                }}
              >
                {providers.map((provider) => (
                  <MenuItem key={provider.name} value={provider.name.toLowerCase()}>
                    {provider.name}
                  </MenuItem>
                ))}
              </Select>
            )}
          </FormControl>

          <Typography variant="subtitle2" gutterBottom>Versão do Modelo</Typography>
          <FormControl fullWidth size="small" sx={{ mb: 3 }}>
            <Select
              value={selectedVersion}
              onChange={(e) => setSelectedVersion(e.target.value)}
              displayEmpty
              renderValue={(selected) => {
                if (!selected) {
                  return <Typography color="text.secondary">Selecione uma versão</Typography>;
                }
                return selected;
              }}
            >
              {providerVersions.map((version) => (
                <MenuItem key={version} value={version}>
                  {version}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <Button 
            variant="contained" 
            fullWidth 
            onClick={() => setSettingsOpen(false)}
            sx={{ mt: 2 }}
          >
            Aplicar Configurações
          </Button>
        </Box>
      </Drawer>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Chat;
