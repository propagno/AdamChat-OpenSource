// src/components/EbookPreview.js
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Button,
  Divider,
  Card,
  CardContent,
  IconButton,
  Tabs,
  Tab,
  CircularProgress,
  Alert,
  Breadcrumbs,
  Link,
  Snackbar
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Download as DownloadIcon,
  Share as ShareIcon,
  Edit as EditIcon,
  Book as BookIcon,
  Description as DescriptionIcon,
  BookmarkBorder as BookmarkIcon,
  Print as PrintIcon
} from '@mui/icons-material';
import { useKeycloak } from '@react-keycloak/web';
import axios from 'axios';

const EbookPreview = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { keycloak } = useKeycloak();
  const [loading, setLoading] = useState(true);
  const [ebook, setEbook] = useState(null);
  const [activeTab, setActiveTab] = useState(0);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'info'
  });

  useEffect(() => {
    const fetchEbookDetails = async () => {
      try {
        setLoading(true);
        // Chamada real à API seria assim:
        // const response = await axios.get(`/api/ebooks/${id}`, {
        //   headers: { Authorization: `Bearer ${keycloak.token}` }
        // });
        // setEbook(response.data);
        
        // Dados simulados para demonstração
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        // Simulando um eBook específico com base no ID
        const mockEbook = {
          id: parseInt(id),
          title: 'Guia Completo sobre Diabetes Tipo 2',
          description: 'Compilação de consultas e orientações sobre tratamento e controle do diabetes tipo 2. Inclui informações importantes sobre medicação, dieta e exercícios físicos recomendados para pacientes com diabetes tipo 2.',
          author: 'Dr. Paulo Silva',
          createdAt: '2023-03-18T14:30:00',
          formats: ['PDF', 'EPUB'],
          coverUrl: 'https://via.placeholder.com/300x400/1976d2/ffffff?text=Diabetes',
          downloads: 23,
          size: '2.4 MB',
          pages: 48,
          chatIds: [1, 3],
          tableOfContents: [
            { title: 'Introdução', page: 1 },
            { title: 'O que é Diabetes Tipo 2', page: 3 },
            { title: 'Sintomas e Diagnóstico', page: 7 },
            { title: 'Tratamento Medicamentoso', page: 12 },
            { title: 'Dieta Recomendada', page: 18 },
            { title: 'Exercícios Físicos', page: 25 },
            { title: 'Monitoramento da Glicemia', page: 32 },
            { title: 'Complicações da Diabetes', page: 38 },
            { title: 'Conclusões', page: 45 },
          ],
          // Conteúdo simulado para preview
          previewContent: `
# Guia Completo sobre Diabetes Tipo 2

**Autor: Dr. Paulo Silva**
**Data: 18/03/2023**

## Introdução

A diabetes tipo 2 é uma doença crônica caracterizada por altos níveis de açúcar no sangue. É uma condição que afeta milhões de pessoas em todo o mundo e requer acompanhamento médico contínuo e cuidados pessoais para prevenir complicações agudas e reduzir o risco de complicações a longo prazo.

Este guia foi desenvolvido a partir de uma série de consultas e orientações médicas para ajudar pacientes a compreender melhor a condição e gerenciar seu tratamento de forma eficaz.

## O que é Diabetes Tipo 2

A diabetes tipo 2 ocorre quando o corpo se torna resistente à insulina ou quando o pâncreas não produz insulina suficiente. A insulina é um hormônio que regula o açúcar no sangue (glicose), que é uma fonte importante de energia para as células que compõem os músculos e tecidos.

Diferentemente da diabetes tipo 1, que geralmente se desenvolve na infância ou adolescência, a diabetes tipo 2 pode se desenvolver a qualquer idade, embora seja mais comum em pessoas com mais de 40 anos.

### Fatores de Risco

Os principais fatores de risco para desenvolver diabetes tipo 2 incluem:

- Excesso de peso ou obesidade
- Inatividade física
- Histórico familiar de diabetes
- Idade avançada
- Hipertensão
- Níveis anormais de colesterol e triglicerídeos
- Histórico de diabetes gestacional
- Síndrome do ovário policístico

## Sintomas e Diagnóstico

Muitas pessoas com diabetes tipo 2 não apresentam sintomas inicialmente, e a condição pode permanecer não diagnosticada por anos. Quando os sintomas estão presentes, eles podem incluir:

- Aumento da sede e micção frequente
- Aumento da fome
- Fadiga
- Visão embaçada
- Feridas que cicatrizam lentamente
- Infecções frequentes
- Formigamento ou dormência nas mãos ou pés

O diagnóstico da diabetes tipo 2 geralmente envolve um ou mais dos seguintes testes:

- Teste de glicemia de jejum
- Teste de tolerância à glicose oral
- Teste de hemoglobina glicada (A1C)
- Teste aleatório de glicose no sangue
          `
        };
        
        setEbook(mockEbook);
      } catch (error) {
        console.error('Erro ao buscar detalhes do eBook:', error);
        setSnackbar({
          open: true,
          message: 'Erro ao carregar o eBook',
          severity: 'error'
        });
      } finally {
        setLoading(false);
      }
    };

    fetchEbookDetails();
  }, [id, keycloak.token]);

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const handleDownload = (format) => {
    // Esta função seria substituída pela lógica real de download
    console.log(`Baixando eBook em formato ${format}`);
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

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '70vh', flexDirection: 'column' }}>
        <CircularProgress size={60} />
        <Typography variant="h6" sx={{ mt: 2 }}>
          Carregando eBook...
        </Typography>
      </Box>
    );
  }

  if (!ebook) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">
          eBook não encontrado ou você não tem permissão para visualizá-lo.
        </Alert>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/ebook-library')}
          sx={{ mt: 2 }}
        >
          Voltar para a Biblioteca
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Breadcrumbs de navegação */}
      <Breadcrumbs sx={{ mb: 2 }}>
        <Link 
          underline="hover" 
          color="inherit" 
          sx={{ cursor: 'pointer' }}
          onClick={() => navigate('/dashboard')}
        >
          Dashboard
        </Link>
        <Link 
          underline="hover" 
          color="inherit" 
          sx={{ cursor: 'pointer' }}
          onClick={() => navigate('/ebook-library')}
        >
          Biblioteca de eBooks
        </Link>
        <Typography color="text.primary">{ebook.title}</Typography>
      </Breadcrumbs>

      {/* Cabeçalho com informações do eBook */}
      <Paper elevation={2} sx={{ p: 3, mb: 3, borderRadius: 2 }}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={3} sx={{ display: 'flex', justifyContent: 'center' }}>
            {ebook.coverUrl ? (
              <img 
                src={ebook.coverUrl} 
                alt={ebook.title}
                style={{ 
                  maxWidth: '100%', 
                  height: 'auto', 
                  maxHeight: 300, 
                  borderRadius: 8,
                  boxShadow: '0 4px 8px rgba(0,0,0,0.2)'
                }}
              />
            ) : (
              <Box 
                sx={{ 
                  width: 200, 
                  height: 300, 
                  bgcolor: 'primary.main', 
                  color: 'white', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  borderRadius: 2,
                  boxShadow: '0 4px 8px rgba(0,0,0,0.2)'
                }}
              >
                <BookIcon sx={{ fontSize: 60 }} />
              </Box>
            )}
          </Grid>
          
          <Grid item xs={12} md={9}>
            <Typography variant="h4" gutterBottom>
              {ebook.title}
            </Typography>
            
            <Typography variant="subtitle1" color="textSecondary" gutterBottom>
              Autor: {ebook.author}
            </Typography>
            
            <Typography variant="body1" paragraph>
              {ebook.description}
            </Typography>
            
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 2 }}>
              <Typography variant="body2">
                <strong>Data de Criação:</strong> {formatDate(ebook.createdAt)}
              </Typography>
              <Typography variant="body2">
                <strong>Páginas:</strong> {ebook.pages}
              </Typography>
              <Typography variant="body2">
                <strong>Tamanho:</strong> {ebook.size}
              </Typography>
              <Typography variant="body2">
                <strong>Downloads:</strong> {ebook.downloads}
              </Typography>
            </Box>
            
            <Box sx={{ display: 'flex', gap: 1, mb: 3 }}>
              {ebook.formats.map((format) => (
                <Button
                  key={format}
                  variant="outlined"
                  size="small"
                  startIcon={<DownloadIcon />}
                  onClick={() => handleDownload(format)}
                >
                  {format}
                </Button>
              ))}
              <Button
                variant="outlined"
                size="small"
                startIcon={<PrintIcon />}
                onClick={() => window.print()}
              >
                Imprimir
              </Button>
              <Button
                variant="outlined"
                size="small"
                startIcon={<ShareIcon />}
              >
                Compartilhar
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* Abas para o conteúdo */}
      <Box sx={{ mb: 2 }}>
        <Tabs value={activeTab} onChange={handleTabChange}>
          <Tab label="Conteúdo" icon={<DescriptionIcon />} iconPosition="start" />
          <Tab label="Índice" icon={<BookmarkIcon />} iconPosition="start" />
        </Tabs>
      </Box>

      {/* Conteúdo baseado na aba selecionada */}
      {activeTab === 0 && (
        <Paper elevation={1} sx={{ p: 3, borderRadius: 2 }}>
          <Box 
            sx={{ 
              whiteSpace: 'pre-wrap', 
              fontFamily: 'serif',
              '& h1, & h2, & h3': {
                color: 'primary.main'
              },
              '& h1': {
                borderBottom: '1px solid #eee',
                paddingBottom: 1
              },
              '& strong': {
                color: 'text.primary'
              }
            }}
          >
            {ebook.previewContent}
          </Box>
        </Paper>
      )}

      {activeTab === 1 && (
        <Paper elevation={1} sx={{ p: 3, borderRadius: 2 }}>
          <Typography variant="h6" gutterBottom>
            Índice
          </Typography>
          <Divider sx={{ mb: 2 }} />
          
          <Box sx={{ mb: 2 }}>
            {ebook.tableOfContents.map((item, index) => (
              <Box 
                key={index} 
                sx={{ 
                  display: 'flex', 
                  justifyContent: 'space-between',
                  mb: 1.5,
                  pb: 1,
                  borderBottom: '1px dotted #ccc'
                }}
              >
                <Typography variant="body1">
                  {item.title}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Página {item.page}
                </Typography>
              </Box>
            ))}
          </Box>
        </Paper>
      )}

      <Box sx={{ mt: 3, display: 'flex', justifyContent: 'space-between' }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/ebook-library')}
        >
          Voltar para a Biblioteca
        </Button>
        
        <Button
          variant="contained"
          startIcon={<EditIcon />}
          onClick={() => navigate(`/ebook-generator?edit=${ebook.id}`)}
        >
          Editar eBook
        </Button>
      </Box>

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

export default EbookPreview; 