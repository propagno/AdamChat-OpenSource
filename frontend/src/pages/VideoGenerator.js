import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  Container,
  Typography,
  Paper,
  Box,
  Button,
  TextField,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Slider,
  Divider,
  Card,
  CardContent,
  CardMedia,
  IconButton,
  CircularProgress,
  Alert,
  Stepper,
  Step,
  StepLabel,
  Stack,
  Chip
} from '@mui/material';
import {
  MovieCreation as MovieIcon,
  Send as SendIcon,
  ArrowBack as ArrowBackIcon,
  PlayArrow as PlayIcon,
  Download as DownloadIcon,
  Delete as DeleteIcon,
  CloudUpload as UploadIcon,
  Settings as SettingsIcon,
  Add as AddIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';

// Variantes de animação
const pageVariants = {
  initial: {
    opacity: 0,
    y: 20
  },
  in: {
    opacity: 1,
    y: 0
  },
  out: {
    opacity: 0,
    y: -20
  }
};

const pageTransition = {
  type: 'tween',
  ease: 'anticipate',
  duration: 0.5
};

// Passos do processo
const steps = ['Configuração', 'Geração', 'Download'];

const VideoGenerator = () => {
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(null);
  const [error, setError] = useState(null);
  const [videoConfig, setVideoConfig] = useState({
    prompt: '',
    style: 'realistic',
    duration: 10,
    resolution: '720p',
    includeAudio: true,
    audioType: 'narration',
    customAudio: null
  });
  const [generatedVideo, setGeneratedVideo] = useState(null);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setVideoConfig({
      ...videoConfig,
      [name]: value
    });
  };

  const handleSwitchChange = (e) => {
    const { name, checked } = e.target;
    setVideoConfig({
      ...videoConfig,
      [name]: checked
    });
  };

  const handleSliderChange = (name) => (e, newValue) => {
    setVideoConfig({
      ...videoConfig,
      [name]: newValue
    });
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setVideoConfig({
        ...videoConfig,
        customAudio: file
      });
    }
  };

  const handleNext = () => {
    if (activeStep === 0) {
      // Gerar vídeo
      generateVideo();
    } else if (activeStep === 1) {
      // Avançar para download
      setActiveStep(2);
    } else {
      // Reset para nova geração
      setActiveStep(0);
      setGeneratedVideo(null);
    }
  };

  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1);
  };

  const generateVideo = () => {
    setLoading(true);
    setError(null);
    
    // Simular geração de vídeo
    setTimeout(() => {
      setLoading(false);
      
      // Simular sucesso ou erro
      if (Math.random() > 0.2) {
        setSuccess('Vídeo gerado com sucesso!');
        setGeneratedVideo({
          id: 'video-' + Date.now(),
          url: 'https://www.w3schools.com/html/mov_bbb.mp4', // URL de vídeo de exemplo
          thumbnail: 'https://via.placeholder.com/300x169',
          title: videoConfig.prompt.substring(0, 30) + '...',
          duration: videoConfig.duration + 's',
          createdAt: new Date().toISOString()
        });
        setActiveStep(1);
      } else {
        setError('Falha ao gerar vídeo. Tente novamente.');
      }
      
      // Limpar mensagem de sucesso após 3 segundos
      setTimeout(() => {
        setSuccess(null);
      }, 3000);
    }, 3000);
  };

  const handleDownload = () => {
    // Simulação de download
    alert('Download iniciado!');
  };

  return (
    <motion.div
      initial="initial"
      animate="in"
      exit="out"
      variants={pageVariants}
      transition={pageTransition}
    >
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <IconButton 
            component={Link} 
            to="/dashboard"
            sx={{ mr: 2 }}
            aria-label="voltar para o dashboard"
          >
            <ArrowBackIcon />
          </IconButton>
          
          <Typography variant="h4" component="h1">
            Gerador de Vídeo IA
          </Typography>
        </Box>

        {success && (
          <Alert severity="success" sx={{ mb: 3 }}>
            {success}
          </Alert>
        )}
        
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        <Grid container spacing={3}>
          <Grid item xs={12} md={activeStep === 0 ? 12 : 6}>
            {activeStep === 0 && (
              <Paper elevation={2} sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                  <MovieIcon sx={{ verticalAlign: 'middle', mr: 1 }} />
                  Configurações do Vídeo
                </Typography>
                
                <Divider sx={{ mb: 3 }} />
                
                <Grid container spacing={3}>
                  <Grid item xs={12}>
                    <TextField
                      label="Descreva o vídeo que você quer criar"
                      name="prompt"
                      value={videoConfig.prompt}
                      onChange={handleInputChange}
                      multiline
                      rows={4}
                      fullWidth
                      required
                      placeholder="Digite uma descrição detalhada do vídeo que você deseja gerar..."
                    />
                  </Grid>
                  
                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth required>
                      <InputLabel>Estilo</InputLabel>
                      <Select
                        name="style"
                        value={videoConfig.style}
                        onChange={handleInputChange}
                      >
                        <MenuItem value="realistic">Realista</MenuItem>
                        <MenuItem value="cartoon">Cartoon</MenuItem>
                        <MenuItem value="3d">3D Animação</MenuItem>
                        <MenuItem value="cinematic">Cinematográfico</MenuItem>
                        <MenuItem value="artistic">Artístico</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  
                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth required>
                      <InputLabel>Resolução</InputLabel>
                      <Select
                        name="resolution"
                        value={videoConfig.resolution}
                        onChange={handleInputChange}
                      >
                        <MenuItem value="480p">480p</MenuItem>
                        <MenuItem value="720p">720p</MenuItem>
                        <MenuItem value="1080p">1080p (Premium)</MenuItem>
                        <MenuItem value="4k">4K (Premium)</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  
                  <Grid item xs={12}>
                    <Typography id="duration-slider" gutterBottom>
                      Duração: {videoConfig.duration} segundos
                    </Typography>
                    <Slider
                      aria-labelledby="duration-slider"
                      value={videoConfig.duration}
                      onChange={handleSliderChange('duration')}
                      min={5}
                      max={30}
                      step={1}
                      marks={[
                        { value: 5, label: '5s' },
                        { value: 15, label: '15s' },
                        { value: 30, label: '30s' }
                      ]}
                      valueLabelDisplay="auto"
                    />
                  </Grid>
                  
                  <Grid item xs={12}>
                    <FormControl fullWidth>
                      <InputLabel>Tipo de Áudio</InputLabel>
                      <Select
                        name="audioType"
                        value={videoConfig.audioType}
                        onChange={handleInputChange}
                      >
                        <MenuItem value="none">Sem áudio</MenuItem>
                        <MenuItem value="background">Música de fundo</MenuItem>
                        <MenuItem value="narration">Narração</MenuItem>
                        <MenuItem value="custom">Áudio personalizado</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  
                  {videoConfig.audioType === 'custom' && (
                    <Grid item xs={12}>
                      <Button
                        variant="outlined"
                        component="label"
                        startIcon={<UploadIcon />}
                        fullWidth
                      >
                        {videoConfig.customAudio ? videoConfig.customAudio.name : 'Carregar áudio personalizado'}
                        <input
                          type="file"
                          accept="audio/*"
                          hidden
                          onChange={handleFileUpload}
                        />
                      </Button>
                    </Grid>
                  )}
                  
                  <Grid item xs={12}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
                      <Button
                        variant="outlined"
                        startIcon={<RefreshIcon />}
                        onClick={() => {
                          setVideoConfig({
                            prompt: '',
                            style: 'realistic',
                            duration: 10,
                            resolution: '720p',
                            includeAudio: true,
                            audioType: 'narration',
                            customAudio: null
                          });
                        }}
                      >
                        Resetar
                      </Button>
                      
                      <Button
                        variant="contained"
                        color="primary"
                        onClick={handleNext}
                        disabled={!videoConfig.prompt || loading}
                        endIcon={loading ? <CircularProgress size={24} /> : <SendIcon />}
                      >
                        {loading ? 'Gerando...' : 'Gerar Vídeo'}
                      </Button>
                    </Box>
                  </Grid>
                </Grid>
              </Paper>
            )}
            
            {activeStep > 0 && (
              <Card>
                <Box sx={{ position: 'relative' }}>
                  {activeStep === 1 && loading ? (
                    <Box
                      sx={{
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        height: 300,
                        bgcolor: 'black'
                      }}
                    >
                      <CircularProgress />
                    </Box>
                  ) : (
                    generatedVideo && (
                      <>
                        <CardMedia
                          component="video"
                          height="300"
                          image={generatedVideo.url}
                          controls
                        />
                        <IconButton
                          aria-label="play/pause"
                          sx={{
                            position: 'absolute',
                            top: '50%',
                            left: '50%',
                            transform: 'translate(-50%, -50%)',
                            color: 'white',
                            bgcolor: 'rgba(0, 0, 0, 0.5)',
                            '&:hover': {
                              bgcolor: 'rgba(0, 0, 0, 0.7)'
                            }
                          }}
                        >
                          <PlayIcon sx={{ height: 38, width: 38 }} />
                        </IconButton>
                      </>
                    )
                  )}
                </Box>
                
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    {videoConfig.prompt.length > 40
                      ? videoConfig.prompt.substring(0, 40) + '...'
                      : videoConfig.prompt}
                  </Typography>
                  
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
                    <Chip label={`Estilo: ${videoConfig.style}`} size="small" />
                    <Chip label={`Duração: ${videoConfig.duration}s`} size="small" />
                    <Chip label={`Resolução: ${videoConfig.resolution}`} size="small" />
                    <Chip label={`Áudio: ${videoConfig.audioType}`} size="small" />
                  </Box>
                  
                  {activeStep === 2 && (
                    <Alert severity="success" sx={{ mb: 2 }}>
                      Seu vídeo está pronto para download!
                    </Alert>
                  )}
                  
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    {activeStep === 1 ? (
                      <Button
                        variant="contained"
                        color="primary"
                        onClick={handleNext}
                        startIcon={<DownloadIcon />}
                      >
                        Preparar para Download
                      </Button>
                    ) : (
                      <Button
                        variant="contained"
                        color="primary"
                        onClick={handleDownload}
                        startIcon={<DownloadIcon />}
                      >
                        Download
                      </Button>
                    )}
                    
                    <Button
                      variant="outlined"
                      color="error"
                      startIcon={<DeleteIcon />}
                    >
                      Excluir
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            )}
          </Grid>
          
          {activeStep > 0 && (
            <Grid item xs={12} md={6}>
              <Paper elevation={2} sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                  <SettingsIcon sx={{ verticalAlign: 'middle', mr: 1 }} />
                  Configurações Avançadas
                </Typography>
                
                <Divider sx={{ mb: 3 }} />
                
                <Typography variant="body2" paragraph>
                  Use essas configurações para refinar seu vídeo gerado ou para 
                  fazer ajustes adicionais.
                </Typography>
                
                <Stack spacing={2}>
                  <Button
                    variant="outlined"
                    fullWidth
                    startIcon={<RefreshIcon />}
                    onClick={generateVideo}
                    disabled={loading}
                  >
                    Regenerar com mesmos parâmetros
                  </Button>
                  
                  <Button
                    variant="outlined"
                    fullWidth
                    startIcon={<AddIcon />}
                    onClick={() => {
                      setActiveStep(0);
                    }}
                  >
                    Criar novo vídeo
                  </Button>
                  
                  {activeStep === 2 && (
                    <>
                      <Typography variant="subtitle2" gutterBottom sx={{ mt: 2 }}>
                        Compartilhar
                      </Typography>
                      
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Button variant="contained" sx={{ flex: 1 }}>
                          Email
                        </Button>
                        <Button variant="contained" sx={{ flex: 1 }}>
                          Whatsapp
                        </Button>
                        <Button variant="contained" sx={{ flex: 1 }}>
                          Link
                        </Button>
                      </Box>
                    </>
                  )}
                </Stack>
              </Paper>
              
              <Paper elevation={2} sx={{ p: 3, mt: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Histórico de Vídeos
                </Typography>
                
                <Divider sx={{ mb: 2 }} />
                
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Você não tem vídeos anteriores.
                  </Typography>
                </Box>
              </Paper>
            </Grid>
          )}
        </Grid>
      </Container>
    </motion.div>
  );
};

export default VideoGenerator; 