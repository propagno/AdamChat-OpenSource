// src/components/ChatPage.js
import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  AppBar,
  Toolbar,
  Typography,
  TextField,
  IconButton,
  Paper,
  Divider
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import { styled } from '@mui/system';

const drawerWidth = 240;

// Lista de agentes (exemplo)
const agents = [
  { id: 1, name: 'Agente Alpha' },
  { id: 2, name: 'Agente Beta' },
  { id: 3, name: 'Agente Gamma' },
];

// Estilização para as mensagens do usuário e da AI
const MessageBubble = styled(Paper)(({ theme, sender }) => ({
  padding: theme.spacing(1, 2),
  backgroundColor: sender === 'user' ? theme.palette.primary.main : theme.palette.grey[300],
  color: sender === 'user' ? theme.palette.primary.contrastText : theme.palette.text.primary,
  maxWidth: '80%',
  alignSelf: sender === 'user' ? 'flex-end' : 'flex-start',
  marginBottom: theme.spacing(1),
  borderRadius: theme.spacing(2),
}));

function ChatPage() {
  const [selectedAgent, setSelectedAgent] = useState(agents[0]);
  const [message, setMessage] = useState('');
  const [chatHistory, setChatHistory] = useState([]);
  const chatEndRef = useRef(null);

  const handleAgentSelect = (agent) => {
    setSelectedAgent(agent);
    // Aqui você pode carregar o histórico específico do agente, se aplicável
  };

  const handleSend = () => {
    if (!message.trim()) return;

    // Adiciona a mensagem do usuário
    const newMessage = { sender: 'user', text: message };
    const newHistory = [...chatHistory, newMessage];
    setChatHistory(newHistory);
    setMessage('');

    // Simulação: chamada à API de GEN AI para obter resposta
    setTimeout(() => {
      const aiResponse = { sender: 'ai', text: `Resposta do ${selectedAgent.name} para "${message}"` };
      setChatHistory((prevHistory) => [...prevHistory, aiResponse]);
    }, 1000);
  };

  // Rola para o fim do chat sempre que o histórico for atualizado
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatHistory]);

  return (
    <Box sx={{ display: 'flex', height: '100vh' }}>
      {/* Menu Lateral para Agentes */}
      <Drawer
        variant="permanent"
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          [`& .MuiDrawer-paper`]: { width: drawerWidth, boxSizing: 'border-box' },
        }}
      >
        <Toolbar>
          <Typography variant="h6" noWrap>
            Agentes
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

      {/* Área Principal do Chat */}
      <Box component="main" sx={{ flexGrow: 1, p: 2, display: 'flex', flexDirection: 'column' }}>
        <AppBar position="static" sx={{ backgroundColor: '#1976d2', mb: 2 }}>
          <Toolbar>
            <Typography variant="h6" sx={{ flexGrow: 1 }}>
              Chat com {selectedAgent.name}
            </Typography>
          </Toolbar>
        </AppBar>

        {/* Histórico do Chat */}
        <Box
          sx={{
            flexGrow: 1,
            p: 2,
            mb: 2,
            border: '1px solid #ddd',
            borderRadius: 2,
            backgroundColor: '#fafafa',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {chatHistory.map((msg, index) => (
            <MessageBubble key={index} elevation={2} sender={msg.sender}>
              {msg.text}
            </MessageBubble>
          ))}
          <div ref={chatEndRef} />
        </Box>

        {/* Campo de Entrada */}
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <TextField
            fullWidth
            variant="outlined"
            placeholder="Digite sua mensagem..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                handleSend();
                e.preventDefault();
              }
            }}
          />
          <IconButton color="primary" onClick={handleSend} sx={{ ml: 1 }}>
            <SendIcon />
          </IconButton>
        </Box>
      </Box>
    </Box>
  );
}

export default ChatPage;
