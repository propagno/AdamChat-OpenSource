import React, { useState } from 'react';
import {
  Box,
  Button,
  Typography,
  Avatar,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemButton,
  Divider,
  Collapse,
  FormControl,
  Select,
  MenuItem,
  Slider,
  CircularProgress,
} from '@mui/material';
import {
  Add as AddIcon,
  Numbers as NumbersIcon,
  Upload as UploadIcon,
  Image as ImageIcon,
  Psychology as PsychologyIcon,
  Memory as MemoryIcon,
  ChatBubble as ChatBubbleIcon,
  ChatBubbleOutline as ChatIcon,
  Delete as DeleteIcon,
  ExpandLess as ExpandLessIcon,
  ExpandMore as ExpandMoreIcon,
  FileUpload as FileUploadIcon,
  DataObject as DataObjectIcon,
} from '@mui/icons-material';

// Função auxiliar para exibir o ícone adequado para cada provedor de IA
const getProviderIcon = (providerName) => {
  const name = providerName?.toLowerCase() || '';
  
  if (name.includes('gpt') || name.includes('openai')) {
    return <Avatar sx={{ width: 24, height: 24, fontSize: '0.8rem', bgcolor: '#10a37f' }}>GPT</Avatar>;
  } else if (name.includes('claude') || name.includes('anthropic')) {
    return <Avatar sx={{ width: 24, height: 24, fontSize: '0.8rem', bgcolor: '#b43c25' }}>C</Avatar>;
  } else if (name.includes('llama') || name.includes('meta')) {
    return <Avatar sx={{ width: 24, height: 24, fontSize: '0.8rem', bgcolor: '#0866ff' }}>LL</Avatar>;
  } else if (name.includes('gemini') || name.includes('google')) {
    return <Avatar sx={{ width: 24, height: 24, fontSize: '0.8rem', bgcolor: '#4285f4' }}>G</Avatar>;
  } else if (name.includes('mistral')) {
    return <Avatar sx={{ width: 24, height: 24, fontSize: '0.8rem', bgcolor: '#5646ed' }}>M</Avatar>;
  } else if (name.includes('palm')) {
    return <Avatar sx={{ width: 24, height: 24, fontSize: '0.8rem', bgcolor: '#36b37e' }}>P</Avatar>;
  } else {
    return <DataObjectIcon fontSize="small" />;
  }
};

const ChatSidebar = ({
  maxTokens,
  setMaxTokens,
  userChats,
  activeChat,
  setActiveChat,
  clearChat,
  providers,
  loadingProviders,
  selectedProvider,
  setSelectedProvider,
  providerVersions,
  selectedVersion,
  setSelectedVersion,
  onNewChat,
  agents,
  loadingAgents,
  selectedAgent,
  setSelectedAgent,
}) => {
  const [chatListOpen, setChatListOpen] = useState(true);
  const [providerListOpen, setProviderListOpen] = useState(false);
  const [agentListOpen, setAgentListOpen] = useState(false);

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: 280,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: 280,
          boxSizing: 'border-box',
          borderRight: '1px solid',
          borderColor: (theme) => theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)',
          bgcolor: (theme) => theme.palette.mode === 'dark' ? '#16162c' : '#ffffff',
        },
      }}
    >
      <Box sx={{ p: 2 }}>
        <Button
          variant="contained"
          fullWidth
          startIcon={<AddIcon />}
          sx={{ 
            py: 1.2, 
            mb: 2,
            borderRadius: 2,
            textTransform: 'none',
            fontWeight: 500,
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
          }}
          onClick={onNewChat}
        >
          Novo Chat
        </Button>

        {/* Campo de personalização de Max Tokens */}
        <Box sx={{ mb: 3, px: 1 }}>
          <Typography variant="subtitle2" gutterBottom>
            Max Tokens
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Slider
              value={maxTokens}
              min={256}
              max={8192}
              step={256}
              onChange={(e, newValue) => setMaxTokens(newValue)}
              aria-labelledby="max-tokens-slider"
              marks={[
                { value: 256, label: '256' },
                { value: 8192, label: '8K' }
              ]}
            />
            <Typography variant="body2" color="text.secondary">
              {maxTokens}
            </Typography>
          </Box>
        </Box>

        <Divider sx={{ mb: 2 }} />

        {/* Lista de chats do usuário */}
        <ListItem
          button
          onClick={() => setChatListOpen(!chatListOpen)}
          sx={{ mb: 1, borderRadius: 1 }}
        >
          <ListItemIcon>
            <ChatBubbleIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText primary="Meus Chats" />
          {chatListOpen ? <ExpandLessIcon /> : <ExpandMoreIcon />}
        </ListItem>

        <Collapse in={chatListOpen} timeout="auto" unmountOnExit>
          <List component="div" disablePadding>
            {userChats.map(chat => (
              <ListItemButton
                key={chat.id}
                selected={activeChat === chat.id}
                sx={{ 
                  pl: 4, 
                  borderRadius: 1,
                  mb: 0.5,
                  '&.Mui-selected': {
                    bgcolor: theme => theme.palette.mode === 'dark' 
                      ? 'rgba(66, 153, 225, 0.2)' 
                      : 'rgba(66, 153, 225, 0.1)',
                  }
                }}
                onClick={() => setActiveChat(chat.id)}
              >
                <ListItemIcon>
                  <ChatIcon fontSize="small" color={activeChat === chat.id ? "primary" : "action"} />
                </ListItemIcon>
                <ListItemText 
                  primary={chat.title} 
                  primaryTypographyProps={{
                    noWrap: true,
                    fontSize: '0.875rem',
                  }}
                  secondary={chat.date}
                  secondaryTypographyProps={{
                    noWrap: true,
                    fontSize: '0.75rem',
                  }}
                />
              </ListItemButton>
            ))}
          </List>
        </Collapse>

        <Divider sx={{ my: 2 }} />

        {/* Botões de Ação */}
        <List>
          <ListItemButton 
            sx={{ borderRadius: 1, mb: 1 }}
            onClick={clearChat}
          >
            <ListItemIcon>
              <DeleteIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText 
              primary="Limpar Histórico" 
              primaryTypographyProps={{ fontSize: '0.9rem' }}
            />
          </ListItemButton>

          <ListItemButton sx={{ borderRadius: 1, mb: 1 }}>
            <ListItemIcon>
              <FileUploadIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText 
              primary="Upload de Arquivos" 
              primaryTypographyProps={{ fontSize: '0.9rem' }}
            />
          </ListItemButton>

          <ListItemButton sx={{ borderRadius: 1, mb: 1 }}>
            <ListItemIcon>
              <ImageIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText 
              primary="Upload de Imagens" 
              primaryTypographyProps={{ fontSize: '0.9rem' }}
            />
          </ListItemButton>

          <ListItemButton sx={{ borderRadius: 1, mb: 1 }}>
            <ListItemIcon>
              <PsychologyIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText 
              primary="Criar Novo Agent" 
              primaryTypographyProps={{ fontSize: '0.9rem' }}
            />
          </ListItemButton>
        </List>

        <Divider sx={{ my: 2 }} />

        {/* Seleção de Motor IA */}
        <ListItem
          button
          onClick={() => setProviderListOpen(!providerListOpen)}
          sx={{ mb: 1, borderRadius: 1 }}
        >
          <ListItemIcon>
            <MemoryIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText primary="Motores IA" />
          {providerListOpen ? <ExpandLessIcon /> : <ExpandMoreIcon />}
        </ListItem>

        <Collapse in={providerListOpen} timeout="auto" unmountOnExit>
          <List component="div" disablePadding>
            {!loadingProviders ? (
              providers.length > 0 ? (
                providers.map((provider, index) => (
                  <ListItemButton
                    key={index}
                    selected={selectedProvider?.name === provider.name}
                    sx={{ 
                      pl: 4, 
                      borderRadius: 1,
                      mb: 0.5,
                      '&.Mui-selected': {
                        bgcolor: theme => theme.palette.mode === 'dark' 
                          ? 'rgba(66, 153, 225, 0.2)' 
                          : 'rgba(66, 153, 225, 0.1)',
                      }
                    }}
                    onClick={() => setSelectedProvider(provider)}
                  >
                    <ListItemIcon>
                      {getProviderIcon(provider.name)}
                    </ListItemIcon>
                    <ListItemText 
                      primary={provider.name} 
                      primaryTypographyProps={{
                        noWrap: true,
                        fontSize: '0.875rem',
                      }}
                    />
                  </ListItemButton>
                ))
              ) : (
                <ListItem sx={{ pl: 4 }}>
                  <ListItemText primary="Nenhum provider disponível" />
                </ListItem>
              )
            ) : (
              <ListItem sx={{ pl: 4 }}>
                <CircularProgress size={24} />
              </ListItem>
            )}
          </List>
        </Collapse>

        {selectedProvider && (
          <Box sx={{ mt: 2, px: 2 }}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Versão do Modelo
            </Typography>
            <FormControl fullWidth size="small">
              <Select
                value={selectedVersion}
                onChange={(e) => setSelectedVersion(e.target.value)}
                displayEmpty
                sx={{ 
                  borderRadius: 2,
                  fontSize: '0.875rem'
                }}
              >
                {providerVersions.map((version) => (
                  <MenuItem key={version} value={version}>
                    {version}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        )}

        <Divider sx={{ my: 2 }} />

        {/* Seleção de Agents */}
        <ListItem
          button
          onClick={() => setAgentListOpen(!agentListOpen)}
          sx={{ mb: 1, borderRadius: 1 }}
        >
          <ListItemIcon>
            <PsychologyIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText primary="Agents Disponíveis" />
          {agentListOpen ? <ExpandLessIcon /> : <ExpandMoreIcon />}
        </ListItem>

        <Collapse in={agentListOpen} timeout="auto" unmountOnExit>
          <List component="div" disablePadding>
            {!loadingAgents ? (
              agents?.length > 0 ? (
                agents.map((agent) => (
                  <ListItemButton
                    key={agent.agent_id}
                    selected={selectedAgent?.agent_id === agent.agent_id}
                    sx={{ 
                      pl: 4, 
                      borderRadius: 1,
                      mb: 0.5,
                      '&.Mui-selected': {
                        bgcolor: theme => theme.palette.mode === 'dark' 
                          ? 'rgba(66, 153, 225, 0.2)' 
                          : 'rgba(66, 153, 225, 0.1)',
                      }
                    }}
                    onClick={() => setSelectedAgent(agent)}
                  >
                    <ListItemIcon>
                      <Avatar
                        sx={{
                          width: 24,
                          height: 24,
                          fontSize: '0.8rem',
                          bgcolor: agent.name ? stringToColor(agent.name) : 'primary.main'
                        }}
                      >
                        {agent.name?.charAt(0) || 'A'}
                      </Avatar>
                    </ListItemIcon>
                    <ListItemText 
                      primary={agent.name} 
                      primaryTypographyProps={{
                        noWrap: true,
                        fontSize: '0.875rem',
                      }}
                    />
                  </ListItemButton>
                ))
              ) : (
                <ListItem sx={{ pl: 4 }}>
                  <ListItemText primary="Nenhum agent disponível" />
                </ListItem>
              )
            ) : (
              <ListItem sx={{ pl: 4 }}>
                <CircularProgress size={24} />
              </ListItem>
            )}
          </List>
        </Collapse>
      </Box>
    </Drawer>
  );
};

// Função para gerar cores de avatar consistentes com base no nome
const stringToColor = (string) => {
  let hash = 0;
  for (let i = 0; i < string.length; i++) {
    hash = string.charCodeAt(i) + ((hash << 5) - hash);
  }
  let color = '#';
  for (let i = 0; i < 3; i++) {
    const value = (hash >> (i * 8)) & 0xff;
    color += `00${value.toString(16)}`.slice(-2);
  }
  return color;
};

export default ChatSidebar; 