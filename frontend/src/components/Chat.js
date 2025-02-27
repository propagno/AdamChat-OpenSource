// src/components/Chat.js
import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import SendIcon from '@mui/icons-material/Send';
import {
  Box,
  Paper,
  Typography,
  TextField,
  IconButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Slide
} from '@mui/material';
import { styled } from '@mui/system';
import { useKeycloak } from '@react-keycloak/web';
import Navbar from './Navbar'; // Importando o Navbar.js para ser o menu principal

const agents = [
  { id: 1, name: 'Agent Médico' },
  { id: 2, name: 'Agent Beta' },
  { id: 3, name: 'Agent Gamma' }
];

const gptProviders = [
  { id: 'chatgpt', name: 'ChatGPT' },
  { id: 'gemini', name: 'Gemini' },
  { id: 'outra_api', name: 'Outra API' }
];

// Balão de mensagem com design moderno e autoajuste de tamanho
const MessageBubble = styled(Paper)(({ theme, sender }) => ({
  padding: theme.spacing(2.5),
  borderRadius: theme.spacing(2),
  backgroundColor: sender === 'ai' ? '#3a3b3c' : '#007bff',
  color: '#fff',
  maxWidth: '70%',
  alignSelf: sender === 'ai' ? 'flex-start' : 'flex-end',
  boxShadow: theme.shadows[2],
  wordWrap: 'break-word',
  whiteSpace: 'pre-wrap',
  overflowWrap: 'break-word',
  animation: 'fadeIn 0.3s ease-in-out',
  textAlign: 'justify',
  marginBottom: theme.spacing(2),
  paddingLeft: theme.spacing(3),
  paddingRight: theme.spacing(3)
}));

const Chat = () => {
  const { keycloak } = useKeycloak();
  const [message, setMessage] = useState("");
  const [history, setHistory] = useState([]);
  const chatEndRef = useRef(null);
  const [selectedAgent, setSelectedAgent] = useState(agents[0]);
  const [selectedGpt, setSelectedGpt] = useState(gptProviders[0].id);
  const user_id = keycloak.tokenParsed ? keycloak.tokenParsed.sub : "usuario_exemplo";
  const user_email = keycloak.tokenParsed ? keycloak.tokenParsed.email : "usuario@example.com";

  const sendMessage = async () => {
    if (message.trim() === "") return;

    const endpoint = `${process.env.REACT_APP_BACKEND_URL}/agent`;
    const payload = {
      user_id,
      user_email,
      message,
      agent: selectedAgent.name.toLowerCase(),
      gptProvider: selectedGpt,
    };

    setMessage("");
    setHistory(prev => [...prev, { sender: user_email, text: message }]);

    try {
      const response = await axios.post(endpoint, payload);
      setHistory(prev => [...prev, ...response.data.history]);
    } catch (error) {
      console.error("Erro ao enviar mensagem:", error);
    }
  };

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [history]);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh', backgroundColor: '#e0e0e0', color: '#000' }}>
      {/* Navbar fixa no topo como Menu Principal */}
      <Navbar />

      {/* Histórico de Mensagens */}
      <Box
        sx={{
          flexGrow: 1,
          overflowY: 'auto',
          p: 3,
          mt: 8,
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
          backgroundColor: '#d1d1d1' // Fundo um pouco mais escuro
        }}
      >
        {history.map((entry, index) => (
          <Slide direction="up" in={true} key={index}>
            <MessageBubble sender={entry.sender}>
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  ol: ({ node, ...props }) => (
                    <Box component="ol" sx={{ pl: 3, mb: 1 }} {...props} />
                  ),
                  ul: ({ node, ...props }) => (
                    <Box component="ul" sx={{ pl: 3, mb: 1 }} {...props} />
                  ),
                  li: ({ node, ...props }) => (
                    <Box component="li" sx={{ mb: 0.5, textAlign: 'justify' }} {...props} />
                  ),
                }}
              >
                {entry.text}
              </ReactMarkdown>
            </MessageBubble>
          </Slide>
        ))}
        <div ref={chatEndRef} />
      </Box>

      {/* Campo de Entrada de Mensagem */}
      <Box sx={{ display: 'flex', p: 2, borderTop: '1px solid #ddd', backgroundColor: '#3a3b3c' }}>
        <FormControl variant="outlined" size="small" sx={{ mr: 1, minWidth: 150, color: '#000' }}>
          <InputLabel sx={{ color: '#fff' }}>Agent</InputLabel>
          <Select
            value={selectedAgent.id}
            onChange={(e) => setSelectedAgent(agents.find(agent => agent.id === e.target.value))}
            label="Agent"
            sx={{ color: '#fff' }}
          >
            {agents.map((agent) => (
              <MenuItem key={agent.id} value={agent.id}>
                {agent.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl variant="outlined" size="small" sx={{ mr: 1, minWidth: 150, color: '#fff' }}>
          <InputLabel sx={{ color: '#fff' }}>GPT</InputLabel>
          <Select
            value={selectedGpt}
            onChange={(e) => setSelectedGpt(e.target.value)}
            label="GPT"
            sx={{ color: '#fff' }}
          >
            {gptProviders.map((provider) => (
              <MenuItem key={provider.id} value={provider.id}>
                {provider.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <TextField
          fullWidth
          variant="outlined"
          placeholder="Digite sua mensagem..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          sx={{ backgroundColor: '#fff', borderRadius: '5px' }}
        />
        <IconButton color="primary" onClick={sendMessage}>
          <SendIcon />
        </IconButton>
      </Box>
    </Box>
  );
};

export default Chat;
