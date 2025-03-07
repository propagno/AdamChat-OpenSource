import React, { useState, useEffect } from 'react';
import { 
  generateVideo, 
  checkVideoStatus, 
  listUserVideos, 
  deleteVideo 
} from '../services/inner-ai-service';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  CardActions,
  CardMedia,
  Button,
  Grid,
  TextField,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  IconButton,
  Tabs,
  Tab,
  Paper,
  Chip,
  Tooltip,
  LinearProgress,
  Skeleton,
  Snackbar,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Divider
} from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import DownloadIcon from '@mui/icons-material/Download';
import InfoIcon from '@mui/icons-material/Info';
import CloseIcon from '@mui/icons-material/Close';

// Constantes de estilos de vídeo
const VIDEO_STYLES = [
  { id: 'cinematic', name: 'Cinematográfico', description: 'Vídeos com qualidade de cinema' },
  { id: 'cartoon', name: 'Animação', description: 'Estilo de desenho animado' },
  { id: 'realistic', name: 'Realista', description: 'Aparência realista e natural' },
  { id: 'artistic', name: 'Artístico', description: 'Estilo mais criativo e expressivo' },
  { id: 'fantasy', name: 'Fantasia', description: 'Elementos mágicos e fantásticos' }
];

// Constantes de durações de vídeo
const VIDEO_DURATIONS = [
  { id: '5sec', name: '5 segundos', tokens: 1000 },
  { id: '10sec', name: '10 segundos', tokens: 1800 },
  { id: '15sec', name: '15 segundos', tokens: 2500 },
  { id: '30sec', name: '30 segundos', tokens: 4000 }
];

const VideoGenerator = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState(null);
  const [prompt, setPrompt] = useState('');
  const [style, setStyle] = useState('cinematic');
  const [duration, setDuration] = useState('10sec');
  const [confirmDelete, setConfirmDelete] = useState({ open: false, video: null });
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });
  const [previewDialog, setPreviewDialog] = useState({ open: false, video: null });
  const [infoDialog, setInfoDialog] = useState({ open: false, tokenCost: 0 });

  useEffect(() => {
    fetchVideos();
  }, []);

  const fetchVideos = async () => {
    try {
      setLoading(true);
      const data = await listUserVideos();
      setVideos(data);
      setError(null);
    } catch (err) {
      console.error('Erro ao carregar vídeos:', err);
      setError('Não foi possível carregar seus vídeos. Tente novamente mais tarde.');
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const handlePromptChange = (event) => {
    setPrompt(event.target.value);
  };

  const handleStyleChange = (event) => {
    setStyle(event.target.value);
  };

  const handleDurationChange = (event) => {
    setDuration(event.target.value);
  };

  const handleGenerateVideo = async () => {
    if (!prompt.trim()) {
      setSnackbar({
        open: true,
        message: 'Por favor, descreva o vídeo que deseja gerar.',
        severity: 'error'
      });
      return;
    }

    try {
      setGenerating(true);
      const selectedDuration = VIDEO_DURATIONS.find(d => d.id === duration);
      const tokenCost = selectedDuration.tokens;
      
      setInfoDialog({
        open: true,
        tokenCost
      });
    } catch (err) {
      console.error('Erro ao preparar geração:', err);
      setSnackbar({
        open: true,
        message: 'Ocorreu um erro ao preparar a geração do vídeo.',
        severity: 'error'
      });
      setGenerating(false);
    }
  };

  const confirmGeneration = async () => {
    try {
      setInfoDialog({ ...infoDialog, open: false });
      const result = await generateVideo(prompt, style, duration);
      
      // Polling para verificar o status do vídeo
      const checkInterval = setInterval(async () => {
        try {
          const status = await checkVideoStatus(result.video_id);
          
          if (status.status === 'completed') {
            clearInterval(checkInterval);
            setSnackbar({
              open: true,
              message: 'Seu vídeo foi gerado com sucesso!',
              severity: 'success'
            });
            fetchVideos();
            setGenerating(false);
            setPrompt('');
          } else if (status.status === 'failed') {
            clearInterval(checkInterval);
            setSnackbar({
              open: true,
              message: 'Falha ao gerar o vídeo. Por favor, tente novamente.',
              severity: 'error'
            });
            setGenerating(false);
          }
          // Se o status for 'processing', continuamos esperando
          
        } catch (err) {
          console.error('Erro ao verificar status do vídeo:', err);
          clearInterval(checkInterval);
          setGenerating(false);
        }
      }, 5000); // Verifica a cada 5 segundos
      
    } catch (err) {
      console.error('Erro ao gerar vídeo:', err);
      setSnackbar({
        open: true,
        message: err.message || 'Ocorreu um erro ao gerar o vídeo. Verifique seus tokens ou tente novamente mais tarde.',
        severity: 'error'
      });
      setGenerating(false);
    }
  };

  const handleDeleteVideo = async () => {
    if (!confirmDelete.video) return;
    
    try {
      await deleteVideo(confirmDelete.video.id);
      setVideos(videos.filter(video => video.id !== confirmDelete.video.id));
      setSnackbar({
        open: true,
        message: 'Vídeo excluído com sucesso.',
        severity: 'success'
      });
    } catch (err) {
      console.error('Erro ao excluir vídeo:', err);
      setSnackbar({
        open: true,
        message: 'Não foi possível excluir o vídeo. Tente novamente mais tarde.',
        severity: 'error'
      });
    } finally {
      setConfirmDelete({ open: false, video: null });
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const handlePreviewVideo = (video) => {
    setPreviewDialog({
      open: true,
      video
    });
  };

  const handleClosePreview = () => {
    setPreviewDialog({
      open: false,
      video: null
    });
  };

  const handleOpenDeleteConfirm = (video) => {
    setConfirmDelete({
      open: true,
      video
    });
  };

  const handleCloseDeleteConfirm = () => {
    setConfirmDelete({
      open: false,
      video: null
    });
  };

  const closeInfoDialog = () => {
    setInfoDialog({ ...infoDialog, open: false });
    setGenerating(false);
  };

  // Filtra vídeos em processamento e completos
  const processingVideos = videos.filter(video => video.status === 'processing');
  const completedVideos = videos.filter(video => video.status === 'completed');

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Gerador de Vídeos com IA
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Crie vídeos incríveis com apenas uma descrição textual. Use nossa inteligência artificial para transformar suas ideias em realidade visual.
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 4 }}>
          {error}
        </Alert>
      )}
      
      <Paper sx={{ mb: 4 }}>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          indicatorColor="primary"
          textColor="primary"
          variant="fullWidth"
        >
          <Tab label="Criar Vídeo" />
          <Tab label="Meus Vídeos" />
        </Tabs>
      </Paper>

      {/* Tab de criação de vídeos */}
      {activeTab === 0 && (
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Nova Geração de Vídeo
          </Typography>
          
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField
                label="Descreva seu vídeo em detalhes"
                multiline
                rows={4}
                fullWidth
                value={prompt}
                onChange={handlePromptChange}
                placeholder="Ex: Um astronauta caminhando em uma floresta tropical alienígena com plantas luminescentes e criaturas exóticas voando pelo céu púrpura."
                helperText="Seja específico sobre cenário, personagens, ações e atmosfera"
                disabled={generating}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <FormControl fullWidth disabled={generating}>
                <InputLabel>Estilo Visual</InputLabel>
                <Select
                  value={style}
                  onChange={handleStyleChange}
                  label="Estilo Visual"
                >
                  {VIDEO_STYLES.map((styleOption) => (
                    <MenuItem key={styleOption.id} value={styleOption.id}>
                      {styleOption.name} - {styleOption.description}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <FormControl fullWidth disabled={generating}>
                <InputLabel>Duração</InputLabel>
                <Select
                  value={duration}
                  onChange={handleDurationChange}
                  label="Duração"
                >
                  {VIDEO_DURATIONS.map((durationOption) => (
                    <MenuItem key={durationOption.id} value={durationOption.id}>
                      {durationOption.name} - {durationOption.tokens} tokens
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                <Button
                  variant="contained"
                  color="primary"
                  size="large"
                  startIcon={generating ? <CircularProgress size={20} color="inherit" /> : <AddIcon />}
                  onClick={handleGenerateVideo}
                  disabled={generating || !prompt.trim()}
                >
                  {generating ? 'Gerando Vídeo...' : 'Gerar Vídeo'}
                </Button>
              </Box>
            </Grid>
          </Grid>
        </Paper>
      )}

      {/* Tab de listagem de vídeos */}
      {activeTab === 1 && (
        <>
          {/* Vídeos em processamento */}
          {processingVideos.length > 0 && (
            <Box sx={{ mb: 4 }}>
              <Typography variant="h6" gutterBottom>
                Vídeos em Processamento
              </Typography>
              
              <Grid container spacing={3}>
                {processingVideos.map((video) => (
                  <Grid item xs={12} sm={6} md={4} key={video.id}>
                    <Card sx={{ height: '100%' }}>
                      <Box sx={{ position: 'relative', pt: '56.25%', bgcolor: 'grey.200' }}>
                        <Box
                          sx={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            width: '100%',
                            height: '100%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexDirection: 'column'
                          }}
                        >
                          <CircularProgress />
                          <Typography variant="body2" sx={{ mt: 2 }}>
                            Processando...
                          </Typography>
                        </Box>
                      </Box>
                      <CardContent>
                        <Typography variant="subtitle1" gutterBottom noWrap>
                          {video.prompt.substring(0, 60)}...
                        </Typography>
                        <Box sx={{ mt: 1 }}>
                          <LinearProgress />
                        </Box>
                        <Box sx={{ display: 'flex', mt: 2, justifyContent: 'space-between' }}>
                          <Chip 
                            label={VIDEO_STYLES.find(s => s.id === video.style)?.name || video.style} 
                            size="small" 
                            color="primary" 
                            variant="outlined"
                          />
                          <Chip 
                            label={VIDEO_DURATIONS.find(d => d.id === video.duration)?.name || video.duration} 
                            size="small" 
                          />
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </Box>
          )}
          
          {/* Vídeos completos */}
          <Box>
            <Typography variant="h6" gutterBottom>
              Vídeos Concluídos
            </Typography>
            
            {loading ? (
              <Grid container spacing={3}>
                {[1, 2, 3].map((item) => (
                  <Grid item xs={12} sm={6} md={4} key={item}>
                    <Card>
                      <Skeleton variant="rectangular" height={200} />
                      <CardContent>
                        <Skeleton variant="text" height={30} />
                        <Skeleton variant="text" height={20} width="60%" />
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            ) : completedVideos.length > 0 ? (
              <Grid container spacing={3}>
                {completedVideos.map((video) => (
                  <Grid item xs={12} sm={6} md={4} key={video.id}>
                    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                      <Box sx={{ position: 'relative', pt: '56.25%' }}>
                        <CardMedia
                          component="img"
                          sx={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover'
                          }}
                          image={video.thumbnail_url}
                          alt={video.prompt}
                        />
                        <IconButton
                          sx={{
                            position: 'absolute',
                            top: '50%',
                            left: '50%',
                            transform: 'translate(-50%, -50%)',
                            bgcolor: 'rgba(0, 0, 0, 0.5)',
                            color: 'white',
                            '&:hover': {
                              bgcolor: 'rgba(0, 0, 0, 0.7)',
                            }
                          }}
                          onClick={() => handlePreviewVideo(video)}
                        >
                          <PlayArrowIcon sx={{ fontSize: 40 }} />
                        </IconButton>
                      </Box>
                      <CardContent sx={{ flexGrow: 1 }}>
                        <Typography variant="subtitle1" gutterBottom noWrap>
                          {video.prompt.substring(0, 60)}...
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Criado em: {new Date(video.created_at).toLocaleDateString()}
                        </Typography>
                        <Box sx={{ display: 'flex', mt: 2, justifyContent: 'space-between' }}>
                          <Chip 
                            label={VIDEO_STYLES.find(s => s.id === video.style)?.name || video.style} 
                            size="small" 
                            color="primary" 
                            variant="outlined"
                          />
                          <Chip 
                            label={VIDEO_DURATIONS.find(d => d.id === video.duration)?.name || video.duration} 
                            size="small" 
                          />
                        </Box>
                      </CardContent>
                      <Divider />
                      <CardActions>
                        <Button 
                          startIcon={<DownloadIcon />} 
                          size="small"
                          component="a"
                          href={video.url}
                          download={`video-${video.id}.mp4`}
                          target="_blank"
                        >
                          Download
                        </Button>
                        <Button 
                          startIcon={<DeleteIcon />} 
                          size="small" 
                          color="error"
                          onClick={() => handleOpenDeleteConfirm(video)}
                        >
                          Excluir
                        </Button>
                      </CardActions>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            ) : (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Typography variant="body1" color="text.secondary">
                  Você ainda não criou nenhum vídeo.
                </Typography>
                <Button 
                  variant="contained" 
                  color="primary"
                  startIcon={<AddIcon />}
                  sx={{ mt: 2 }}
                  onClick={() => setActiveTab(0)}
                >
                  Criar Primeiro Vídeo
                </Button>
              </Box>
            )}
          </Box>
        </>
      )}

      {/* Dialog de confirmação de custo de tokens */}
      <Dialog
        open={infoDialog.open}
        onClose={closeInfoDialog}
      >
        <DialogTitle>
          Confirmar Geração de Vídeo
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            A geração deste vídeo custará <strong>{infoDialog.tokenCost} tokens</strong> da sua conta.
            <br /><br />
            O tempo de processamento pode variar de acordo com a complexidade do vídeo solicitado.
            <br /><br />
            Deseja continuar?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeInfoDialog} color="inherit">
            Cancelar
          </Button>
          <Button onClick={confirmGeneration} color="primary" variant="contained" autoFocus>
            Confirmar Geração
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog de confirmação de exclusão */}
      <Dialog
        open={confirmDelete.open}
        onClose={handleCloseDeleteConfirm}
      >
        <DialogTitle>
          Confirmar Exclusão
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            Tem certeza que deseja excluir este vídeo? Esta ação não pode ser desfeita.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDeleteConfirm} color="inherit">
            Cancelar
          </Button>
          <Button onClick={handleDeleteVideo} color="error" variant="contained">
            Excluir
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog de preview do vídeo */}
      <Dialog
        open={previewDialog.open}
        onClose={handleClosePreview}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          Preview do Vídeo
          <IconButton onClick={handleClosePreview}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          {previewDialog.video && (
            <>
              <Box sx={{ position: 'relative', pt: '56.25%' }}>
                <Box
                  component="video"
                  sx={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%'
                  }}
                  controls
                  autoPlay
                  src={previewDialog.video.url}
                />
              </Box>
              <Typography variant="subtitle1" sx={{ mt: 2 }}>
                {previewDialog.video.prompt}
              </Typography>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Snackbar de notificações */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        message={snackbar.message}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default VideoGenerator; 