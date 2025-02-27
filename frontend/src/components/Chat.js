// src/components/Chat.js
import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import SendIcon from '@mui/icons-material/Send';
import ReplayIcon from '@mui/icons-material/Replay';
import DeleteIcon from '@mui/icons-material/Delete';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import {
  Box,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Toolbar,
  Typography,
  TextField,
  Button,
  Paper,
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle
} from '@mui/material';
import { styled } from '@mui/system';
import { useKeycloak } from '@react-keycloak/web';

const drawerWidth = 240;

const agents = [
  { id: 1, name: 'Agent Médico' },
  { id: 2, name: 'Agent Beta' },
  { id: 3, name: 'Agent Gamma' },
];

const gptProviders = [
  { id: 'chatgpt', name: 'ChatGPT' },
  { id: 'gemini', name: 'Gemini' },
  { id: 'outra_api', name: 'Outra API' },
];

// Balão de mensagem com espaçamento aprimorado
const MessageBubble = styled(Paper)(({ theme, sender }) => ({
  position: 'relative',
  padding: theme.spacing(1.5, 2),
  backgroundColor: sender === "ai" ? theme.palette.grey[800] : theme.palette.primary.main,
  color: sender === "ai" ? theme.palette.common.white : theme.palette.primary.contrastText,
  maxWidth: '80%',
  alignSelf: sender === "ai" ? 'flex-start' : 'flex-end',
  marginBottom: theme.spacing(2),
  borderRadius: theme.spacing(2),
}));

const IconBar = styled(Box)(({ theme }) => ({
  display: 'flex',
  justifyContent: 'flex-end',
  gap: theme.spacing(1),
  marginTop: theme.spacing(1),
}));

const Chat = () => {
  const { keycloak } = useKeycloak();
  const [message, setMessage] = useState("");
  const [history, setHistory] = useState([]);
  const [selectedAgent, setSelectedAgent] = useState(agents[0]);
  const [selectedGpt, setSelectedGpt] = useState(gptProviders[0].id);
  const chatEndRef = useRef(null);
  const [isWaitingResponse, setIsWaitingResponse] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const timerRef = useRef(null);
  // Estados para o modal de re-run (edição para reprocessar a mensagem)
  const [editOpen, setEditOpen] = useState(false);
  const [editText, setEditText] = useState("");
  const [editIndex, setEditIndex] = useState(null);

  // Dados do usuário via Keycloak
  const user_id = keycloak.tokenParsed ? keycloak.tokenParsed.sub : "usuario_exemplo";
  const user_email = keycloak.tokenParsed ? keycloak.tokenParsed.email : "usuario@example.com";

  const handleAgentSelect = (agent) => {
    setSelectedAgent(agent);
  };

  const handleGptSelect = (event) => {
    setSelectedGpt(event.target.value);
  };

  // Gera ID único simples para as mensagens
  const generateId = () => Math.random().toString(36).substring(2, 9);

  // Envia a mensagem do usuário e insere imediatamente no histórico
  const sendMessage = async () => {
    if (message.trim() === "") return;

    const isMedical = selectedAgent.name.toLowerCase() === "agent médico";
    const endpoint = `${process.env.REACT_APP_BACKEND_URL}/agent`;
    const userMsgId = generateId();

    // Insere a mensagem do usuário no histórico antes de enviar ao backend
    const userPayload = {
      id: userMsgId,
      sender: user_email,
      text: message,
      agent: selectedAgent.name.toLowerCase(),
      gpt: selectedGpt
    };
    setHistory(prev => [...prev, userPayload]);

    const payload = isMedical
      ? {
          user_id,
          user_email,
          consultation_data: message,
          agent: selectedAgent.name.toLowerCase(),
          gptProvider: selectedGpt,
          userMsgId,
        }
      : {
          user_id,
          user_email,
          message,
          agent: selectedAgent.name.toLowerCase(),
          gptProvider: selectedGpt,
          userMsgId,
        };

    setMessage("");
    setIsWaitingResponse(true);
    setElapsedTime(0);
    const startTime = Date.now();
    timerRef.current = setInterval(() => {
      setElapsedTime(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);

    try {
      const response = await axios.post(endpoint, payload);
      setHistory(response.data.history);
    } catch (error) {
      console.error("Erro ao enviar mensagem:", error);
    } finally {
      setIsWaitingResponse(false);
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  // Re-run: reprocessa a mensagem original do usuário (identificada pelo parentId)
  const handleRerun = async (index) => {
    const aiMsg = history[index];
    if (!aiMsg || !aiMsg.parentId) return;
    const userMsg = history.find((msg) => msg.id === aiMsg.parentId);
    if (!userMsg) return;
    await sendRerunMessage(userMsg.text);
  };

  const sendRerunMessage = async (text) => {
    const isMedical = selectedAgent.name.toLowerCase() === "agent médico";
    const endpoint = `${process.env.REACT_APP_BACKEND_URL}/agent`;
    const payload = isMedical
      ? {
          user_id,
          user_email,
          consultation_data: text,
          agent: selectedAgent.name.toLowerCase(),
          gptProvider: selectedGpt,
        }
      : {
          user_id,
          user_email,
          message: text,
          agent: selectedAgent.name.toLowerCase(),
          gptProvider: selectedGpt,
        };

    try {
      const response = await axios.post(endpoint, payload);
      setHistory(response.data.history);
    } catch (error) {
      console.error("Erro ao re-run mensagem:", error);
    }
  };

  // Deleta a mensagem do histórico local
  const handleDelete = (index) => {
    setHistory(prev => prev.filter((_, i) => i !== index));
  };

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    console.log("Texto copiado:", text);
  };

  // Modal de re-run para reprocessar a resposta da IA (edição)
  const handleEditClose = () => {
    setEditOpen(false);
    setEditText("");
    setEditIndex(null);
  };

  const handleEditConfirm = () => {
    if (editText.trim() === "" || editIndex === null) return;
    sendRerunMessage(editText);
    setEditOpen(false);
    setEditText("");
    setEditIndex(null);
  };

  const handleEdit = (index) => {
    const aiMsg = history[index];
    if (!aiMsg || aiMsg.sender !== "ai") return;
    setEditText(aiMsg.text);
    setEditIndex(index);
    setEditOpen(true);
  };

  // Carrega histórico do backend ao montar o componente
  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const response = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/chat/history`, {
          params: { user_id }
        });
        setHistory(response.data.history);
      } catch (error) {
        console.error("Erro ao carregar histórico:", error);
      }
    };
    fetchHistory();
  }, [user_id]);

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [history]);

  return (
    <Box sx={{ display: 'flex', height: '100vh', backgroundColor: '#121212', color: '#fff' }}>
      {/* Barra lateral para Agents */}
      <Drawer
        variant="permanent"
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          [`& .MuiDrawer-paper`]: {
            width: drawerWidth,
            boxSizing: 'border-box',
            backgroundColor: '#1e1e1e',
            color: '#fff',
          },
        }}
      >
        <Toolbar>
          <Typography variant="h6" noWrap>
            Agents
          </Typography>
        </Toolbar>
        <Divider />
        <List>
          {agents.map((agent) => (
            <ListItem key={agent.id} disablePadding>
              <ListItemButton
                selected={selectedAgent.id === agent.id}
                onClick={() => handleAgentSelect(agent)}
              >
                <ListItemText primary={agent.name} />
              </ListItemButton>
            </ListItem>
          ))}
        </List>
      </Drawer>

      {/* Área principal do Chat */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          ml: `${drawerWidth}px`,
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: '#121212',
          color: '#fff',
        }}
      >
        <Typography variant="h5" sx={{ mb: 2 }}>
          Chat com {selectedAgent.name}
        </Typography>

        {isWaitingResponse && (
          <Typography variant="body2" sx={{ mb: 2 }}>
            Aguarde... (Tempo de resposta: {elapsedTime}s)
          </Typography>
        )}

        {/* Histórico de mensagens */}
        <Box
          sx={{
            flexGrow: 1,
            overflowY: 'auto',
            mb: 2,
            p: 2,
            border: '1px solid #333',
            borderRadius: 2,
            backgroundColor: '#1e1e1e',
            display: 'flex',
            flexDirection: 'column',
            gap: 2,
          }}
        >
          {history.map((entry, index) => (
            <MessageBubble key={index} sender={entry.sender}>
              {entry.sender === "ai" ? (
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    h1: ({ node, ...props }) => (
                      <Typography variant="h5" sx={{ fontWeight: 'bold', mt: 2, mb: 1 }} {...props} />
                    ),
                    h2: ({ node, ...props }) => (
                      <Typography variant="h6" sx={{ fontWeight: 'bold', mt: 2, mb: 1 }} {...props} />
                    ),
                    p: ({ node, ...props }) => (
                      <Typography variant="body1" sx={{ mb: 1 }} {...props} />
                    ),
                    // Ajuste o pl para 2 para as listas (ordenadas e não ordenadas) ficarem menos recuadas
                    ul: ({ node, ...props }) => (
                      <Box component="ul" sx={{ pl: 2, mb: 1 }} {...props} />
                    ),
                    ol: ({ node, ...props }) => (
                      <Box component="ol" sx={{ pl: 2, mb: 1 }} {...props} />
                    ),
                    li: ({ node, ...props }) => (
                      <Box component="li" sx={{ mb: 0.5 }} {...props} />
                    ),
                  }}
                >
                  {entry.text}
                </ReactMarkdown>
              ) : (
                <Typography variant="body1">{entry.text}</Typography>
              )}
              {entry.sender === "ai" && (
                <Box sx={{ mt: 1 }}>
                  <Typography variant="caption" display="block">
                    Agent: {entry.agent} | GPT: {entry.gpt}
                  </Typography>
                  <IconBar>
                    <IconButton size="small" onClick={() => handleRerun(index)}>
                      <ReplayIcon fontSize="small" />
                    </IconButton>
                    <IconButton size="small" onClick={() => handleDelete(index)}>
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                    <IconButton size="small" onClick={() => handleCopy(entry.text)}>
                      <ContentCopyIcon fontSize="small" />
                    </IconButton>
                  </IconBar>
                </Box>
              )}
            </MessageBubble>
          ))}
          <div ref={chatEndRef} />
        </Box>

        {/* Campo de entrada, botão e dropdown para selecionar o GPT */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Box sx={{ display: 'flex' }}>
            <TextField
              fullWidth
              variant="outlined"
              placeholder="Digite sua mensagem..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  sendMessage();
                  e.preventDefault();
                }
              }}
              sx={{
                backgroundColor: '#1e1e1e',
                input: { color: '#fff' },
                '& fieldset': { borderColor: '#333' },
              }}
            />
            <Button variant="contained" color="secondary" onClick={sendMessage} sx={{ ml: 1 }}>
              <SendIcon />
            </Button>
          </Box>
          <Box>
            <FormControl fullWidth variant="outlined" size="small">
              <InputLabel id="gpt-select-label" sx={{ color: "#fff" }}>
                Selecionar GPT
              </InputLabel>
              <Select
                labelId="gpt-select-label"
                value={selectedGpt}
                label="Selecionar GPT"
                onChange={handleGptSelect}
                sx={{
                  color: "#fff",
                  '.MuiOutlinedInput-notchedOutline': { borderColor: "#fff" },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: "#fff" },
                  '& .MuiSvgIcon-root': { color: "#fff" }
                }}
              >
                {gptProviders.map((provider) => (
                  <MenuItem key={provider.id} value={provider.id}>
                    {provider.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        </Box>
      </Box>

      {/* Modal de re-run para reprocessar a mensagem (edição) */}
      <Dialog open={editOpen} onClose={handleEditClose} maxWidth="sm" fullWidth>
        <DialogTitle>Reprocessar Mensagem</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            multiline
            rows={4}
            variant="outlined"
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleEditClose}>Cancelar</Button>
          <Button variant="contained" onClick={handleEditConfirm}>Confirmar</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Chat;
