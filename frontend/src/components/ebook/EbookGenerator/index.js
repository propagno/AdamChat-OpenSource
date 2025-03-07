import React, { useState, useEffect } from 'react';
import { 
  Typography, 
  Box, 
  Card, 
  CardContent, 
  Grid, 
  TextField, 
  Button, 
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Divider,
  Stepper,
  Step,
  StepLabel,
  Paper,
  Chip,
  ListItem,
  ListItemText,
  List,
  Checkbox,
  FormControlLabel,
  Alert,
  Snackbar,
  CircularProgress,
  IconButton,
  Tooltip,
  FormGroup
} from '@mui/material';
import {
  Book as BookIcon,
  Save as SaveIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  Download as DownloadIcon,
  Upload as UploadIcon,
  CloudUpload as CloudUploadIcon,
  Visibility as VisibilityIcon,
  Edit as EditIcon,
  FormatListBulleted as FormatListIcon,
  Settings as SettingsIcon
} from '@mui/icons-material';
import { useKeycloak } from '@react-keycloak/web';
import axios from 'axios';

const EbookGenerator = () => {
  const { keycloak } = useKeycloak();
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [chats, setChats] = useState([]);
  const [selectedChats, setSelectedChats] = useState([]);
  const [ebookTitle, setEbookTitle] = useState('');
  const [ebookDescription, setEbookDescription] = useState('');
  const [ebookAuthor, setEbookAuthor] = useState('');
  const [coverImage, setCoverImage] = useState(null);
  const [coverImagePreview, setCoverImagePreview] = useState('');
  const [formats, setFormats] = useState(['PDF']);
  const [customizationOptions, setCustomizationOptions] = useState({
    includeTimestamps: true,
    includeChatMetadata: true,
    includeTableOfContents: true,
    fontFamily: 'Roboto',
    fontSize: 12,
    colorTheme: 'light',
  });
  const [generatedEbook, setGeneratedEbook] = useState(null);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'info'
  });

  const steps = ['Selecionar Conteúdo', 'Informações do eBook', 'Personalização', 'Geração e Download'];

  // Função para buscar conversas no chat
  useEffect(() => {
    const fetchChats = async () => {
      try {
        setLoading(true);
        // Dados simulados para usar quando a API não estiver disponível
        const mockChats = [
          { id: 1, title: 'Consulta sobre diabetes tipo 2', date: '2023-03-15', messageCount: 23 },
          { id: 2, title: 'Acompanhamento de hipertensão', date: '2023-03-20', messageCount: 18 },
          { id: 3, title: 'Orientações nutricionais', date: '2023-03-25', messageCount: 15 },
          { id: 4, title: 'Consulta pré-natal', date: '2023-04-01', messageCount: 27 },
          { id: 5, title: 'Avaliação cardiológica', date: '2023-04-05', messageCount: 20 }
        ];
        
        try {
          // Tentativa de buscar dados da API real
          const response = await axios.get('/api/chats', {
            headers: {
              Authorization: `Bearer ${keycloak.token}`
            }
          });
          
          // Se a API retornar dados com sucesso, use-os
          if (response.data && Array.isArray(response.data)) {
            setChats(response.data);
          } else {
            // Se a API retornar um formato inesperado, use dados simulados
            console.log('Formato de resposta da API inesperado, usando dados simulados');
            setChats(mockChats);
          }
        } catch (apiError) {
          // Se a chamada da API falhar, use dados simulados
          console.log('API não disponível, usando dados simulados:', apiError);
          setChats(mockChats);
        }
      } catch (error) {
        console.error('Erro ao processar chats:', error);
        // Ainda use dados simulados mesmo se houver um erro geral
        setChats([
          { id: 1, title: 'Consulta sobre diabetes tipo 2', date: '2023-03-15', messageCount: 23 },
          { id: 2, title: 'Acompanhamento de hipertensão', date: '2023-03-20', messageCount: 18 },
          { id: 3, title: 'Orientações nutricionais', date: '2023-03-25', messageCount: 15 }
        ]);
        
        // Informe o usuário que estamos usando dados simulados
        setSnackbar({
          open: true,
          message: 'Usando dados de demonstração para os chats',
          severity: 'info'
        });
      } finally {
        setLoading(false);
      }
    };

    fetchChats();
  }, [keycloak.token]);

  const handleNext = () => {
    setActiveStep((prevStep) => prevStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1);
  };

  const handleToggleChat = (chatId) => {
    setSelectedChats((prevSelected) => {
      if (prevSelected.includes(chatId)) {
        return prevSelected.filter(id => id !== chatId);
      } else {
        return [...prevSelected, chatId];
      }
    });
  };

  const handleCoverImageChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      setCoverImage(file);
      const reader = new FileReader();
      reader.onload = () => {
        setCoverImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleFormatChange = (format) => {
    setFormats(prevFormats => {
      if (prevFormats.includes(format)) {
        return prevFormats.filter(f => f !== format);
      } else {
        return [...prevFormats, format];
      }
    });
  };

  const handleCustomizationChange = (property, value) => {
    setCustomizationOptions(prev => ({
      ...prev,
      [property]: value
    }));
  };

  const handleGenerateEbook = async () => {
    if (selectedChats.length === 0) {
      setSnackbar({
        open: true,
        message: 'Selecione pelo menos um chat para gerar o eBook',
        severity: 'warning'
      });
      return;
    }

    try {
      setLoading(true);
      // Construir os dados para enviar à API de geração de eBook
      const formData = new FormData();
      formData.append('title', ebookTitle);
      formData.append('description', ebookDescription);
      formData.append('author', ebookAuthor);
      formData.append('chatIds', JSON.stringify(selectedChats));
      formData.append('formats', JSON.stringify(formats));
      formData.append('options', JSON.stringify(customizationOptions));
      
      if (coverImage) {
        formData.append('coverImage', coverImage);
      }

      let response;
      try {
        // Tentativa de chamada real à API
        response = await axios.post('/api/ebooks/generate', formData, {
          headers: {
            Authorization: `Bearer ${keycloak.token}`,
            'Content-Type': 'multipart/form-data'
          },
          timeout: 5000 // 5 segundos de timeout
        });
        
        // Se a API retornar com sucesso, use a resposta
        if (response && response.data) {
          setGeneratedEbook(response.data);
          setSnackbar({
            open: true,
            message: 'eBook gerado com sucesso!',
            severity: 'success'
          });
          handleNext();
          return;
        }
      } catch (apiError) {
        // Se a API falhar, vamos registrar o erro mas usar simulação
        console.log('API de geração de eBook não disponível, usando simulação:', apiError);
      }

      // Simulação de processamento - só será executada se a API falhar
      await new Promise(resolve => setTimeout(resolve, 2000));
      const mockResponse = {
        success: true,
        data: {
          id: Math.floor(Math.random() * 1000),
          title: ebookTitle,
          formats: formats.map(format => ({
            format,
            url: `#download-mock-${format.toLowerCase()}`
          }))
        }
      };

      setGeneratedEbook(mockResponse.data);
      setSnackbar({
        open: true,
        message: 'eBook de demonstração gerado com sucesso!',
        severity: 'success'
      });
      handleNext();
    } catch (error) {
      console.error('Erro ao gerar eBook:', error);
      setSnackbar({
        open: true,
        message: 'Erro ao gerar o eBook. Tente novamente.',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (format) => {
    try {
      setLoading(true);
      
      // Mostra uma mensagem de início de download
      setSnackbar({
        open: true,
        message: `Iniciando download do eBook em ${format}...`,
        severity: 'info'
      });
      
      try {
        // Tenta fazer o download real da API
        if (generatedEbook && generatedEbook.id) {
          const response = await axios.get(`/api/ebooks/${generatedEbook.id}/download/${format.toLowerCase()}`, {
            headers: {
              Authorization: `Bearer ${keycloak.token}`
            },
            responseType: 'blob',
            timeout: 5000 // 5 segundos de timeout
          });
          
          // Se a API retornar um blob de dados, cria um link para download
          if (response && response.data) {
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `${ebookTitle}.${format.toLowerCase()}`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            
            setSnackbar({
              open: true,
              message: `Download do eBook em ${format} concluído com sucesso!`,
              severity: 'success'
            });
            return;
          }
        }
      } catch (apiError) {
        console.log('API de download não disponível, simulando download:', apiError);
      }
      
      // Simulação de download - será executada apenas se a API falhar
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Cria um arquivo de exemplo para download
      let content = '';
      if (format.toLowerCase() === 'pdf' || format.toLowerCase() === 'epub' || format.toLowerCase() === 'mobi') {
        // Para formatos binários, crie um pequeno arquivo de texto simulando o conteúdo
        content = `Este é um documento de demonstração no formato ${format} para "${ebookTitle}" por ${ebookAuthor}.\n\nEste arquivo é apenas uma simulação para propósitos de demonstração.`;
      } else if (format.toLowerCase() === 'html') {
        // Para HTML, crie um HTML real com algum conteúdo
        content = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>${ebookTitle}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 40px; line-height: 1.6; }
            h1 { color: #2c3e50; }
            .author { color: #7f8c8d; font-style: italic; }
            .description { background-color: #f9f9f9; padding: 20px; border-radius: 5px; margin: 20px 0; }
            .footer { margin-top: 50px; text-align: center; font-size: 0.8em; color: #95a5a6; }
          </style>
        </head>
        <body>
          <h1>${ebookTitle}</h1>
          <p class="author">Por ${ebookAuthor}</p>
          <div class="description">
            <p>${ebookDescription || 'Sem descrição fornecida.'}</p>
          </div>
          <h2>Conteúdo</h2>
          <p>Este é um arquivo HTML de demonstração gerado pela aplicação AdamChat.</p>
          <p>Em uma implementação real, este arquivo conteria o conteúdo completo das conversas selecionadas.</p>
          <div class="footer">
            <p>Gerado por AdamChat eBook Generator - Demonstração</p>
          </div>
        </body>
        </html>
        `;
      }
      
      // Cria um objeto blob com o conteúdo
      const blob = new Blob([content], { type: format.toLowerCase() === 'html' ? 'text/html' : 'text/plain' });
      const url = window.URL.createObjectURL(blob);
      
      // Cria um link para download e simula um clique
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${ebookTitle}_demo.${format.toLowerCase()}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      setSnackbar({
        open: true,
        message: `Arquivo de demonstração de ${format} baixado com sucesso`,
        severity: 'success'
      });
    } catch (error) {
      console.error(`Erro ao baixar eBook em ${format}:`, error);
      setSnackbar({
        open: true,
        message: `Erro ao baixar o eBook em ${format}. Tente novamente.`,
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({
      ...prev,
      open: false
    }));
  };

  const getStepContent = (step) => {
    switch (step) {
      case 0:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Selecione as conversas para incluir no eBook
            </Typography>
            <Typography variant="body2" color="textSecondary" paragraph>
              Escolha os chats que deseja converter em eBook. Você pode selecionar múltiplos chats.
            </Typography>
            
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
                <CircularProgress />
              </Box>
            ) : (
              <List sx={{ width: '100%', bgcolor: 'background.paper' }}>
                {chats.map((chat) => (
                  <Paper key={chat.id} elevation={1} sx={{ mb: 2, borderRadius: 2 }}>
                    <ListItem
                      secondaryAction={
                        <Checkbox
                          edge="end"
                          onChange={() => handleToggleChat(chat.id)}
                          checked={selectedChats.includes(chat.id)}
                        />
                      }
                      sx={{ 
                        borderLeft: selectedChats.includes(chat.id) ? 4 : 0, 
                        borderColor: 'primary.main',
                        borderLeftStyle: 'solid'
                      }}
                    >
                      <ListItemText
                        primary={chat.title}
                        secondary={
                          <React.Fragment>
                            <Typography component="span" variant="body2" color="textPrimary">
                              Data: {chat.date} • {chat.messageCount} mensagens
                            </Typography>
                          </React.Fragment>
                        }
                      />
                    </ListItem>
                  </Paper>
                ))}
              </List>
            )}
            
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
              <Typography variant="body2">
                {selectedChats.length} {selectedChats.length === 1 ? 'chat selecionado' : 'chats selecionados'}
              </Typography>
              
              <Button 
                variant="contained" 
                onClick={handleNext}
                disabled={selectedChats.length === 0}
                endIcon={<BookIcon />}
              >
                Continuar
              </Button>
            </Box>
          </Box>
        );
      
      case 1:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Informações do eBook
            </Typography>
            <Typography variant="body2" color="textSecondary" paragraph>
              Forneça os detalhes básicos para o seu eBook.
            </Typography>
            
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <TextField
                  required
                  fullWidth
                  label="Título do eBook"
                  value={ebookTitle}
                  onChange={(e) => setEbookTitle(e.target.value)}
                  helperText="Um título descritivo para o seu eBook"
                />
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Autor"
                  value={ebookAuthor}
                  onChange={(e) => setEbookAuthor(e.target.value)}
                  helperText="Nome do autor ou organização"
                />
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Descrição"
                  value={ebookDescription}
                  onChange={(e) => setEbookDescription(e.target.value)}
                  multiline
                  rows={4}
                  helperText="Uma breve descrição sobre o conteúdo do eBook"
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Box sx={{ border: '1px dashed grey', borderRadius: 2, p: 3, textAlign: 'center', height: '100%' }}>
                  <input
                    accept="image/*"
                    id="cover-image-upload"
                    type="file"
                    onChange={handleCoverImageChange}
                    style={{ display: 'none' }}
                  />
                  <label htmlFor="cover-image-upload">
                    {!coverImagePreview ? (
                      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer' }}>
                        <CloudUploadIcon sx={{ fontSize: 60, color: 'primary.main', mb: 2 }} />
                        <Typography variant="body1">Clique para adicionar imagem de capa</Typography>
                        <Typography variant="caption" color="textSecondary">
                          Recomendado: 1400 x 2100 pixels
                        </Typography>
                      </Box>
                    ) : (
                      <Box sx={{ position: 'relative' }}>
                        <img 
                          src={coverImagePreview} 
                          alt="Capa do eBook" 
                          style={{ maxWidth: '100%', maxHeight: '200px', borderRadius: '4px' }} 
                        />
                        <Box sx={{ position: 'absolute', top: 0, right: 0 }}>
                          <IconButton 
                            onClick={(e) => {
                              e.preventDefault();
                              setCoverImage(null);
                              setCoverImagePreview('');
                            }}
                            sx={{ bgcolor: 'rgba(255,255,255,0.7)' }}
                            size="small"
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Box>
                      </Box>
                    )}
                  </label>
                </Box>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle1" gutterBottom>
                  Formatos de Saída
                </Typography>
                <Typography variant="body2" color="textSecondary" paragraph>
                  Escolha em quais formatos o eBook será gerado
                </Typography>
                
                <FormGroup>
                  <FormControlLabel 
                    control={
                      <Checkbox 
                        checked={formats.includes('PDF')} 
                        onChange={() => handleFormatChange('PDF')}
                      />
                    } 
                    label="PDF"
                  />
                  <FormControlLabel 
                    control={
                      <Checkbox 
                        checked={formats.includes('EPUB')} 
                        onChange={() => handleFormatChange('EPUB')}
                      />
                    } 
                    label="EPUB"
                  />
                  <FormControlLabel 
                    control={
                      <Checkbox 
                        checked={formats.includes('MOBI')} 
                        onChange={() => handleFormatChange('MOBI')}
                      />
                    } 
                    label="MOBI"
                  />
                  <FormControlLabel 
                    control={
                      <Checkbox 
                        checked={formats.includes('HTML')} 
                        onChange={() => handleFormatChange('HTML')}
                      />
                    } 
                    label="HTML"
                  />
                </FormGroup>
              </Grid>
            </Grid>
            
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
              <Button onClick={handleBack}>
                Voltar
              </Button>
              <Button 
                variant="contained" 
                onClick={handleNext}
                disabled={!ebookTitle}
              >
                Continuar
              </Button>
            </Box>
          </Box>
        );
      
      case 2:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Personalização do eBook
            </Typography>
            <Typography variant="body2" color="textSecondary" paragraph>
              Configure a aparência e opções de conteúdo do seu eBook.
            </Typography>
            
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Card sx={{ height: '100%' }}>
                  <CardContent>
                    <Typography variant="subtitle1" gutterBottom>
                      <FormatListIcon fontSize="small" sx={{ verticalAlign: 'middle', mr: 1 }} />
                      Opções de Conteúdo
                    </Typography>
                    <Divider sx={{ mb: 2 }} />
                    
                    <FormGroup>
                      <FormControlLabel 
                        control={
                          <Checkbox 
                            checked={customizationOptions.includeTimestamps} 
                            onChange={(e) => handleCustomizationChange('includeTimestamps', e.target.checked)}
                          />
                        } 
                        label="Incluir data e hora das mensagens"
                      />
                      <FormControlLabel 
                        control={
                          <Checkbox 
                            checked={customizationOptions.includeChatMetadata} 
                            onChange={(e) => handleCustomizationChange('includeChatMetadata', e.target.checked)}
                          />
                        } 
                        label="Incluir metadados do chat (título, participantes)"
                      />
                      <FormControlLabel 
                        control={
                          <Checkbox 
                            checked={customizationOptions.includeTableOfContents} 
                            onChange={(e) => handleCustomizationChange('includeTableOfContents', e.target.checked)}
                          />
                        } 
                        label="Gerar índice"
                      />
                    </FormGroup>
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="subtitle1" gutterBottom>
                      <SettingsIcon fontSize="small" sx={{ verticalAlign: 'middle', mr: 1 }} />
                      Opções de Estilo
                    </Typography>
                    <Divider sx={{ mb: 2 }} />
                    
                    <FormControl fullWidth sx={{ mb: 2 }}>
                      <InputLabel>Fonte</InputLabel>
                      <Select
                        value={customizationOptions.fontFamily}
                        onChange={(e) => handleCustomizationChange('fontFamily', e.target.value)}
                        label="Fonte"
                      >
                        <MenuItem value="Roboto">Roboto</MenuItem>
                        <MenuItem value="Arial">Arial</MenuItem>
                        <MenuItem value="Times New Roman">Times New Roman</MenuItem>
                        <MenuItem value="Georgia">Georgia</MenuItem>
                        <MenuItem value="Verdana">Verdana</MenuItem>
                      </Select>
                    </FormControl>
                    
                    <FormControl fullWidth sx={{ mb: 2 }}>
                      <InputLabel>Tamanho da Fonte</InputLabel>
                      <Select
                        value={customizationOptions.fontSize}
                        onChange={(e) => handleCustomizationChange('fontSize', e.target.value)}
                        label="Tamanho da Fonte"
                      >
                        <MenuItem value={10}>Pequeno (10pt)</MenuItem>
                        <MenuItem value={12}>Médio (12pt)</MenuItem>
                        <MenuItem value={14}>Grande (14pt)</MenuItem>
                        <MenuItem value={16}>Muito Grande (16pt)</MenuItem>
                      </Select>
                    </FormControl>
                    
                    <FormControl fullWidth>
                      <InputLabel>Tema de Cores</InputLabel>
                      <Select
                        value={customizationOptions.colorTheme}
                        onChange={(e) => handleCustomizationChange('colorTheme', e.target.value)}
                        label="Tema de Cores"
                      >
                        <MenuItem value="light">Claro</MenuItem>
                        <MenuItem value="dark">Escuro</MenuItem>
                        <MenuItem value="sepia">Sépia</MenuItem>
                        <MenuItem value="blue">Azul</MenuItem>
                      </Select>
                    </FormControl>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
            
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
              <Button onClick={handleBack}>
                Voltar
              </Button>
              <Button 
                variant="contained" 
                onClick={handleGenerateEbook}
                disabled={loading}
                startIcon={loading ? <CircularProgress size={20} /> : <BookIcon />}
              >
                {loading ? 'Gerando...' : 'Gerar eBook'}
              </Button>
            </Box>
          </Box>
        );
      
      case 3:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Download do eBook
            </Typography>
            
            {generatedEbook ? (
              <Box>
                <Alert severity="success" sx={{ mb: 3 }}>
                  Seu eBook "{generatedEbook.title}" foi gerado com sucesso!
                </Alert>
                
                <Card sx={{ mb: 3 }}>
                  <CardContent>
                    <Grid container spacing={2} alignItems="center">
                      <Grid item xs={12} md={coverImagePreview ? 8 : 12}>
                        <Typography variant="h5" gutterBottom>{generatedEbook.title}</Typography>
                        {ebookAuthor && (
                          <Typography variant="subtitle1" color="textSecondary" gutterBottom>
                            Por: {ebookAuthor}
                          </Typography>
                        )}
                        {ebookDescription && (
                          <Typography variant="body2" paragraph>
                            {ebookDescription}
                          </Typography>
                        )}
                        
                        <Typography variant="body2">
                          <strong>Chats incluídos:</strong> {selectedChats.length}
                        </Typography>
                        <Typography variant="body2">
                          <strong>Formatos disponíveis:</strong> {formats.join(', ')}
                        </Typography>
                      </Grid>
                      
                      {coverImagePreview && (
                        <Grid item xs={12} md={4} sx={{ textAlign: 'center' }}>
                          <img 
                            src={coverImagePreview} 
                            alt="Capa do eBook" 
                            style={{ maxWidth: '100%', maxHeight: '200px', borderRadius: '4px' }} 
                          />
                        </Grid>
                      )}
                    </Grid>
                  </CardContent>
                </Card>
                
                <Typography variant="subtitle1" gutterBottom>
                  Fazer download nos formatos selecionados:
                </Typography>
                
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 3 }}>
                  {formats.map((format) => (
                    <Button
                      key={format}
                      variant="outlined"
                      onClick={() => handleDownload(format)}
                      startIcon={<DownloadIcon />}
                    >
                      Download {format}
                    </Button>
                  ))}
                </Box>
                
                <Divider sx={{ my: 3 }} />
                
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Button onClick={() => {
                    // Resetar o formulário para criar um novo eBook
                    setActiveStep(0);
                    setSelectedChats([]);
                    setEbookTitle('');
                    setEbookDescription('');
                    setEbookAuthor('');
                    setCoverImage(null);
                    setCoverImagePreview('');
                    setFormats(['PDF']);
                    setGeneratedEbook(null);
                  }}>
                    Criar Novo eBook
                  </Button>
                  
                  <Button 
                    variant="contained"
                    onClick={() => {
                      // Aqui poderia ter uma função para visualizar o eBook
                      console.log('Visualizando eBook');
                    }}
                    startIcon={<VisibilityIcon />}
                  >
                    Visualizar eBook
                  </Button>
                </Box>
              </Box>
            ) : (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <CircularProgress />
                <Typography variant="body1" sx={{ mt: 2 }}>
                  Carregando seu eBook...
                </Typography>
              </Box>
            )}
          </Box>
        );
      
      default:
        return 'Passo desconhecido';
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          <BookIcon fontSize="large" sx={{ verticalAlign: 'middle', mr: 1 }} />
          Gerador de eBook
        </Typography>
        <Typography variant="body1" color="textSecondary">
          Converta suas conversas de chat em um eBook formatado e pronto para compartilhar ou publicar.
        </Typography>
      </Box>
      
      <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
        {steps.map((label) => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>
      
      <Paper elevation={2} sx={{ p: 3, borderRadius: 2 }}>
        {getStepContent(activeStep)}
      </Paper>
      
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default EbookGenerator; 