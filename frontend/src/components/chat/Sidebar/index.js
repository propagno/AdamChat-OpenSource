import React, { useState } from 'react';
import {
  Box,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemButton,
  Divider,
  IconButton,
  Typography,
  Button,
  Tooltip,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Collapse,
  Slider,
  InputAdornment,
  useTheme,
  Paper,
  MenuItem,
  Select,
  FormControl,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material';
import {
  ChatBubbleOutline as ChatIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  Settings as SettingsIcon,
  Edit as EditIcon,
  ExpandLess,
  ExpandMore,
  FormatClear as ClearIcon,
  Save as SaveIcon,
  Tune as TuneIcon,
  Close as CloseIcon,
  MoreVert as MoreVertIcon
} from '@mui/icons-material';

const Sidebar = ({
  conversations = [],
  currentConversationId,
  onConversationSelect,
  onNewConversation,
  onDeleteConversation,
  onClearMessages,
  onRenameConversation,
  providers = [],
  selectedProvider,
  onProviderChange,
  providerVersions = [],
  selectedVersion,
  onVersionChange,
  maxTokens = 2048,
  onMaxTokensChange,
  temperature = 0.7,
  onTemperatureChange,
  onSaveSettings
}) => {
  const theme = useTheme();
  const [showSettings, setShowSettings] = useState(false);
  const [renameDialogOpen, setRenameDialogOpen] = useState(false);
  const [selectedConversationId, setSelectedConversationId] = useState(null);
  const [newTitle, setNewTitle] = useState('');
  const [showAdvancedSettings, setShowAdvancedSettings] = useState(false);

  const handleRenameClick = (conversationId, currentTitle) => {
    setSelectedConversationId(conversationId);
    setNewTitle(currentTitle);
    setRenameDialogOpen(true);
  };

  const handleSaveNewTitle = () => {
    if (newTitle.trim()) {
      onRenameConversation(selectedConversationId, newTitle.trim());
    }
    setRenameDialogOpen(false);
  };

  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString();
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <Paper 
      elevation={0}
      sx={{ 
        width: 280, 
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        borderRight: '1px solid',
        borderColor: 'divider',
        bgcolor: theme.palette.mode === 'dark' ? '#1e1e2d' : '#ffffff',
      }}
    >
      {/* Header */}
      <Box sx={{ 
        p: 2, 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        borderBottom: '1px solid',
        borderColor: 'divider',
      }}>
        <Typography variant="h6">Conversas</Typography>
        <Button
          variant="contained"
          size="small"
          startIcon={<AddIcon />}
          onClick={onNewConversation}
        >
          Nova Conversa
        </Button>
      </Box>

      {/* Conversation List */}
      <Box sx={{ flex: 1, overflow: 'auto' }}>
        {conversations.length === 0 ? (
          <Box sx={{ p: 3, textAlign: 'center', color: 'text.secondary' }}>
            <ChatIcon sx={{ fontSize: 40, opacity: 0.5, mb: 1 }} />
            <Typography variant="body2">
              Nenhuma conversa ainda
            </Typography>
          </Box>
        ) : (
          <List disablePadding>
            {conversations.map((conversation) => (
              <ListItem 
                key={conversation.id} 
                button
                selected={conversation.id === currentConversationId}
                onClick={() => onConversationSelect(conversation.id)}
                sx={{ 
                  borderBottom: '1px solid',
                  borderColor: 'divider',
                  py: 1.5,
                  px: 2,
                  '&.Mui-selected': {
                    bgcolor: theme.palette.mode === 'dark' ? 'rgba(144, 202, 249, 0.08)' : 'rgba(33, 150, 243, 0.08)',
                  }
                }}
              >
                <ListItemIcon sx={{ minWidth: 36 }}>
                  <ChatIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText 
                  primary={conversation.title || "Nova Conversa"} 
                  secondary={`${formatDate(conversation.createdAt)} • ${formatTime(conversation.createdAt)}`}
                  primaryTypographyProps={{ 
                    noWrap: true, 
                    style: { maxWidth: '120px' } 
                  }}
                />
                <Box>
                  <Tooltip title="Editar título">
                    <IconButton 
                      size="small" 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRenameClick(conversation.id, conversation.title);
                      }}
                    >
                      <EditIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  {conversation.id === currentConversationId && (
                    <Tooltip title="Excluir conversa">
                      <IconButton 
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteConversation(conversation.id);
                        }}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  )}
                </Box>
              </ListItem>
            ))}
          </List>
        )}
      </Box>

      {/* Actions */}
      <Box sx={{ p: 2, borderTop: '1px solid', borderColor: 'divider' }}>
        <Button
          fullWidth
          variant="outlined"
          startIcon={<ClearIcon />}
          onClick={onClearMessages}
          sx={{ mb: 1 }}
        >
          Limpar Mensagens
        </Button>
        <Button
          fullWidth
          variant="outlined"
          startIcon={<SettingsIcon />}
          onClick={() => setShowSettings(!showSettings)}
        >
          Configurações
        </Button>
      </Box>

      {/* Settings */}
      <Collapse in={showSettings}>
        <Box sx={{ 
          p: 2, 
          borderTop: '1px solid', 
          borderColor: 'divider',
          bgcolor: theme.palette.mode === 'dark' ? 'rgba(0, 0, 0, 0.1)' : 'rgba(0, 0, 0, 0.02)',
        }}>
          <Typography variant="subtitle2" gutterBottom>
            Provedor de IA
          </Typography>
          <FormControl fullWidth size="small" sx={{ mb: 2 }}>
            <Select
              value={selectedProvider?.id || ''}
              onChange={(e) => {
                const provider = providers.find(p => p.id === e.target.value);
                onProviderChange(provider);
              }}
              displayEmpty
            >
              <MenuItem value="" disabled>
                <em>Selecione um provedor</em>
              </MenuItem>
              {providers.map(provider => (
                <MenuItem key={provider.id} value={provider.id}>
                  {provider.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <Typography variant="subtitle2" gutterBottom>
            Versão do Modelo
          </Typography>
          <FormControl fullWidth size="small" sx={{ mb: 2 }}>
            <Select
              value={selectedVersion || ''}
              onChange={(e) => onVersionChange(e.target.value)}
              displayEmpty
              disabled={!providerVersions.length}
            >
              <MenuItem value="" disabled>
                <em>Selecione uma versão</em>
              </MenuItem>
              {providerVersions.map(version => (
                <MenuItem key={version} value={version}>
                  {version}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <Accordion 
            expanded={showAdvancedSettings} 
            onChange={() => setShowAdvancedSettings(!showAdvancedSettings)}
            disableGutters
            elevation={0}
            sx={{ 
              border: '1px solid',
              borderColor: 'divider',
              '&:before': {
                display: 'none',
              },
            }}
          >
            <AccordionSummary expandIcon={<ExpandMore />}>
              <Typography variant="subtitle2">Configurações Avançadas</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Typography variant="body2" gutterBottom>
                Max Tokens
              </Typography>
              <Box sx={{ px: 1, mb: 2 }}>
                <Slider
                  value={maxTokens}
                  onChange={(e, newValue) => onMaxTokensChange(newValue)}
                  min={256}
                  max={8192}
                  step={128}
                  valueLabelDisplay="auto"
                  size="small"
                />
                <TextField
                  size="small"
                  value={maxTokens}
                  onChange={(e) => {
                    const value = parseInt(e.target.value);
                    if (!isNaN(value) && value >= 256 && value <= 8192) {
                      onMaxTokensChange(value);
                    }
                  }}
                  InputProps={{
                    endAdornment: <InputAdornment position="end">tokens</InputAdornment>,
                  }}
                  sx={{ 
                    width: '100%',
                    mt: 1,
                    '& input': { textAlign: 'right' }
                  }}
                />
              </Box>

              <Typography variant="body2" gutterBottom>
                Temperatura
              </Typography>
              <Box sx={{ px: 1 }}>
                <Slider
                  value={temperature}
                  onChange={(e, newValue) => onTemperatureChange(newValue)}
                  min={0}
                  max={1}
                  step={0.1}
                  valueLabelDisplay="auto"
                  size="small"
                />
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                  <Typography variant="caption">Preciso</Typography>
                  <Typography variant="caption">Criativo</Typography>
                </Box>
              </Box>
            </AccordionDetails>
          </Accordion>

          <Button
            fullWidth
            variant="contained"
            startIcon={<SaveIcon />}
            onClick={onSaveSettings}
            sx={{ mt: 2 }}
          >
            Salvar Configurações
          </Button>
        </Box>
      </Collapse>

      {/* Rename Dialog */}
      <Dialog open={renameDialogOpen} onClose={() => setRenameDialogOpen(false)}>
        <DialogTitle>Renomear Conversa</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Novo título"
            fullWidth
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            variant="outlined"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRenameDialogOpen(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSaveNewTitle} color="primary">
            Salvar
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
};

export default Sidebar; 