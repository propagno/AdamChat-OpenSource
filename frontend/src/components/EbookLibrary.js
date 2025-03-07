// src/components/EbookLibrary.js
import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Button,
  IconButton,
  Divider,
  TextField,
  InputAdornment,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Menu,
  MenuItem,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Tooltip,
  CircularProgress,
  Alert,
  Snackbar,
  Skeleton
} from '@mui/material';
import {
  Book as BookIcon,
  Search as SearchIcon,
  Download as DownloadIcon,
  Delete as DeleteIcon,
  Share as ShareIcon,
  MoreVert as MoreIcon,
  Visibility as ViewIcon,
  Add as AddIcon,
  FilterList as FilterIcon
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const EbookLibrary = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [ebooks, setEbooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEbook, setSelectedEbook] = useState(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [menuAnchorEl, setMenuAnchorEl] = useState(null);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'info'
  });

  // Buscar eBooks na API
  useEffect(() => {
    const fetchEbooks = async () => {
      try {
        setLoading(true);
        // Chamada real à API seria assim:
        // const response = await axios.get('/api/ebooks', {
        //   headers: { Authorization: `Bearer ${keycloak.token}` }
        // });
        // setEbooks(response.data);
        
        // Dados simulados para demonstração
        await new Promise(resolve => setTimeout(resolve, 1500));
        const mockEbooks = [
          {
            id: 1,
            title: 'Guia Completo sobre Diabetes Tipo 2',
            description: 'Compilação de consultas e orientações sobre tratamento e controle do diabetes tipo 2.',
            author: 'Dr. Paulo Silva',
            createdAt: '2023-03-18T14:30:00',
            formats: ['PDF', 'EPUB'],
            coverUrl: 'https://via.placeholder.com/150x200/1976d2/ffffff?text=Diabetes',
            downloads: 23,
            size: '2.4 MB',
            chatIds: [1, 3]
          },
          {
            id: 2,
            title: 'Orientações Nutricionais para Hipertensos',
            description: 'Conjunto de recomendações nutricionais para pacientes com hipertensão.',
            author: 'Dra. Ana Mendes',
            createdAt: '2023-03-25T10:15:00',
            formats: ['PDF', 'MOBI'],
            coverUrl: 'https://via.placeholder.com/150x200/9c27b0/ffffff?text=Nutrição',
            downloads: 15,
            size: '1.8 MB',
            chatIds: [2]
          },
          {
            id: 3,
            title: 'Guia Pré-Natal: Primeiros Trimestres',
            description: 'Informações e cuidados essenciais para o acompanhamento pré-natal nos primeiros trimestres.',
            author: 'Dra. Carla Rodrigues',
            createdAt: '2023-04-05T09:45:00',
            formats: ['PDF', 'EPUB', 'HTML'],
            coverUrl: 'https://via.placeholder.com/150x200/4caf50/ffffff?text=Pré-Natal',
            downloads: 32,
            size: '3.1 MB',
            chatIds: [4]
          }
        ];
        setEbooks(mockEbooks);
      } catch (error) {
        console.error('Erro ao buscar eBooks:', error);
        setSnackbar({
          open: true,
          message: 'Erro ao carregar a biblioteca de eBooks',
          severity: 'error'
        });
      } finally {
        setLoading(false);
      }
    };

    fetchEbooks();
  }, [user.token]);

  const handleMenuOpen = (event, ebook) => {
    setMenuAnchorEl(event.currentTarget);
    setSelectedEbook(ebook);
  };

  const handleMenuClose = () => {
    setMenuAnchorEl(null);
  };

  const handleDeleteClick = () => {
    handleMenuClose();
    setDeleteConfirmOpen(true);
  };

  const handleShareClick = () => {
    handleMenuClose();
    setShareDialogOpen(true);
  };

  const confirmDelete = async () => {
    try {
      // Chamada real à API seria assim:
      // await axios.delete(`/api/ebooks/${selectedEbook.id}`, {
      //   headers: { Authorization: `Bearer ${keycloak.token}` }
      // });
      
      // Simulação de exclusão
      await new Promise(resolve => setTimeout(resolve, 1000));
      setEbooks(ebooks.filter(ebook => ebook.id !== selectedEbook.id));
      setSnackbar({
        open: true,
        message: 'eBook excluído com sucesso',
        severity: 'success'
      });
    } catch (error) {
      console.error('Erro ao excluir eBook:', error);
      setSnackbar({
        open: true,
        message: 'Erro ao excluir o eBook',
        severity: 'error'
      });
    } finally {
      setDeleteConfirmOpen(false);
      setSelectedEbook(null);
    }
  };

  const handleDownload = (format, ebook) => {
    // Esta função seria substituída pela lógica real de download
    console.log(`Baixando eBook "${ebook.title}" em formato ${format}`);
    setSnackbar({
      open: true,
      message: `Download do eBook em ${format} iniciado`,
      severity: 'info'
    });
  };

  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({
      ...prev,
      open: false
    }));
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR');
  };

  const filteredEbooks = ebooks.filter(ebook => 
    ebook.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ebook.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ebook.author.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Função para renderizar os eBooks em modo de carregamento
  const renderSkeletons = () => {
    return Array(3).fill(0).map((_, index) => (
      <TableRow key={`skeleton-${index}`}>
        <TableCell>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Skeleton variant="rectangular" width={40} height={60} sx={{ mr: 2, borderRadius: 1 }} />
            <Box>
              <Skeleton variant="text" width={200} />
              <Skeleton variant="text" width={150} />
            </Box>
          </Box>
        </TableCell>
        <TableCell><Skeleton variant="text" width={150} /></TableCell>
        <TableCell><Skeleton variant="text" width={90} /></TableCell>
        <TableCell><Skeleton variant="text" width={100} /></TableCell>
        <TableCell>
          <Skeleton variant="rounded" width={70} height={30} sx={{ borderRadius: 4 }} />
        </TableCell>
        <TableCell><Skeleton variant="circular" width={40} height={40} /></TableCell>
      </TableRow>
    ));
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          <BookIcon fontSize="large" sx={{ verticalAlign: 'middle', mr: 1 }} />
          Biblioteca de eBooks
        </Typography>
        <Typography variant="body1" color="textSecondary">
          Gerencie todos os eBooks já criados a partir dos chats.
        </Typography>
      </Box>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <TextField
          placeholder="Buscar eBooks"
          variant="outlined"
          size="small"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
          sx={{ width: 300 }}
        />
        
        <Box>
          <Button 
            variant="contained" 
            startIcon={<AddIcon />}
            onClick={() => navigate('/ebook-generator')}
          >
            Criar Novo eBook
          </Button>
        </Box>
      </Box>

      <TableContainer component={Paper} elevation={1} sx={{ mb: 4, borderRadius: 2 }}>
        <Table sx={{ minWidth: 650 }}>
          <TableHead>
            <TableRow>
              <TableCell>Título</TableCell>
              <TableCell>Data de Criação</TableCell>
              <TableCell>Tamanho</TableCell>
              <TableCell>Downloads</TableCell>
              <TableCell>Formatos</TableCell>
              <TableCell>Ações</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              renderSkeletons()
            ) : filteredEbooks.length > 0 ? (
              filteredEbooks.map((ebook) => (
                <TableRow key={ebook.id} hover>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      {ebook.coverUrl ? (
                        <img 
                          src={ebook.coverUrl} 
                          alt={ebook.title}
                          style={{ width: 40, height: 60, marginRight: 16, borderRadius: 4, objectFit: 'cover' }}
                        />
                      ) : (
                        <Box 
                          sx={{ 
                            width: 40, 
                            height: 60, 
                            bgcolor: 'primary.main', 
                            color: 'white', 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center',
                            mr: 2,
                            borderRadius: 1
                          }}
                        >
                          <BookIcon />
                        </Box>
                      )}
                      <Box>
                        <Typography variant="subtitle1">{ebook.title}</Typography>
                        <Typography variant="body2" color="textSecondary">
                          {ebook.author}
                        </Typography>
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>{formatDate(ebook.createdAt)}</TableCell>
                  <TableCell>{ebook.size}</TableCell>
                  <TableCell>{ebook.downloads}</TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      {ebook.formats.map(format => (
                        <Chip 
                          key={format} 
                          label={format} 
                          size="small" 
                          color="primary" 
                          variant="outlined"
                          onClick={() => handleDownload(format, ebook)}
                        />
                      ))}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <IconButton
                      aria-label="mais opções"
                      onClick={(event) => handleMenuOpen(event, ebook)}
                    >
                      <MoreIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  <Box sx={{ py: 3 }}>
                    <Typography variant="body1">Nenhum eBook encontrado</Typography>
                    {searchTerm && (
                      <Typography variant="body2" color="textSecondary">
                        Tente uma busca diferente ou crie um novo eBook
                      </Typography>
                    )}
                  </Box>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Menu de ações para cada eBook */}
      <Menu
        anchorEl={menuAnchorEl}
        open={Boolean(menuAnchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => {
          handleMenuClose();
          navigate(`/ebook-preview/${selectedEbook?.id}`);
        }}>
          <ViewIcon fontSize="small" sx={{ mr: 1 }} />
          Visualizar
        </MenuItem>
        <MenuItem onClick={handleShareClick}>
          <ShareIcon fontSize="small" sx={{ mr: 1 }} />
          Compartilhar
        </MenuItem>
        <Divider />
        <MenuItem onClick={handleDeleteClick} sx={{ color: 'error.main' }}>
          <DeleteIcon fontSize="small" sx={{ mr: 1 }} />
          Excluir
        </MenuItem>
      </Menu>

      {/* Diálogo de confirmação de exclusão */}
      <Dialog
        open={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
      >
        <DialogTitle>Confirmar Exclusão</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Tem certeza que deseja excluir o eBook "{selectedEbook?.title}"? Esta ação não pode ser desfeita.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirmOpen(false)}>Cancelar</Button>
          <Button onClick={confirmDelete} color="error" autoFocus>
            Excluir
          </Button>
        </DialogActions>
      </Dialog>

      {/* Diálogo de compartilhamento */}
      <Dialog
        open={shareDialogOpen}
        onClose={() => setShareDialogOpen(false)}
      >
        <DialogTitle>Compartilhar eBook</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            Compartilhe o link do eBook "{selectedEbook?.title}" ou envie diretamente para um email.
          </DialogContentText>
          <TextField
            fullWidth
            label="Email do destinatário"
            type="email"
            variant="outlined"
            sx={{ mb: 2 }}
          />
          <TextField
            fullWidth
            label="Link para compartilhamento"
            value={selectedEbook ? `https://adamchat.example.com/shared-ebook/${selectedEbook.id}` : ''}
            InputProps={{
              readOnly: true,
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={() => {
                      navigator.clipboard.writeText(`https://adamchat.example.com/shared-ebook/${selectedEbook.id}`);
                      setSnackbar({
                        open: true,
                        message: 'Link copiado para a área de transferência',
                        severity: 'success'
                      });
                    }}
                  >
                    <Tooltip title="Copiar link">
                      <ShareIcon fontSize="small" />
                    </Tooltip>
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShareDialogOpen(false)}>Cancelar</Button>
          <Button onClick={() => {
            setShareDialogOpen(false);
            setSnackbar({
              open: true,
              message: 'eBook compartilhado com sucesso',
              severity: 'success'
            });
          }} color="primary">
            Enviar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar para mensagens */}
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

export default EbookLibrary; 