import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useKeycloak } from '@react-keycloak/web';
import axios from 'axios';
import { 
  Box, 
  Typography, 
  TextField, 
  Grid, 
  Button, 
  Card, 
  CardContent, 
  Divider, 
  Alert, 
  Snackbar,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  CircularProgress,
  Paper
} from '@mui/material';
import { 
  Save as SaveIcon, 
  Upload as UploadIcon,
  ArrowBack as ArrowBackIcon,
  Person as PersonIcon
} from '@mui/icons-material';

const CadastroPaciente = () => {
  const navigate = useNavigate();
  const { keycloak } = useKeycloak();
  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState(null);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'info'
  });

  // Estado do formulário
  const [formData, setFormData] = useState({
    nome: '',
    dataNascimento: '',
    cpf: '',
    rg: '',
    genero: '',
    estadoCivil: '',
    profissao: '',
    telefone: '',
    celular: '',
    email: '',
    endereco: {
      logradouro: '',
      numero: '',
      complemento: '',
      bairro: '',
      cidade: '',
      estado: '',
      cep: ''
    },
    convenio: {
      nome: '',
      numero: '',
      validade: ''
    },
    emergencia: {
      nome: '',
      telefone: '',
      relacao: ''
    },
    alergias: '',
    medicacoes: '',
    doencasCronicas: '',
    cirurgias: '',
    historicoFamiliar: ''
  });

  // Manipuladores de eventos
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    // Verifica se é um campo aninhado (com ".")
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData({
        ...formData,
        [parent]: {
          ...formData[parent],
          [child]: value
        }
      });
    } else {
      setFormData({
        ...formData,
        [name]: value
      });
    }
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      // Verifica se o arquivo é do tipo permitido (.docx, .xls, .xlsx)
      const fileExt = selectedFile.name.split('.').pop().toLowerCase();
      if (['docx', 'xls', 'xlsx'].includes(fileExt)) {
        setFile(selectedFile);
      } else {
        setSnackbar({
          open: true,
          message: 'Formato de arquivo não suportado. Por favor, use .docx, .xls ou .xlsx',
          severity: 'error'
        });
      }
    }
  };

  const handleFileUpload = async () => {
    if (!file) {
      setSnackbar({
        open: true,
        message: 'Por favor, selecione um arquivo para importar',
        severity: 'warning'
      });
      return;
    }

    try {
      setLoading(true);
      const formData = new FormData();
      formData.append('file', file);

      // Chamada à API para processamento do arquivo
      const response = await axios.post('/api/upload-ficha', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${keycloak.token}`
        }
      });

      if (response.data && response.data.success) {
        setSnackbar({
          open: true,
          message: 'Arquivo processado com sucesso! Dados do paciente extraídos.',
          severity: 'success'
        });
        
        // Atualiza o formulário com os dados extraídos do arquivo
        if (response.data.patientData) {
          setFormData(response.data.patientData);
        }
      }
    } catch (error) {
      console.error('Erro ao processar arquivo:', error);
      setSnackbar({
        open: true,
        message: error.response?.data?.message || 'Erro ao processar o arquivo. Tente novamente.',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    
    // Validação básica
    if (!formData.nome || !formData.cpf || !formData.dataNascimento) {
      setSnackbar({
        open: true,
        message: 'Por favor, preencha os campos obrigatórios: Nome, CPF e Data de Nascimento',
        severity: 'warning'
      });
      return;
    }

    try {
      setLoading(true);
      
      // Chamada à API para cadastrar ou atualizar o paciente
      const response = await axios.post('/api/pacientes', formData, {
        headers: {
          'Authorization': `Bearer ${keycloak.token}`
        }
      });

      if (response.data && response.data.success) {
        setSnackbar({
          open: true,
          message: 'Paciente cadastrado com sucesso!',
          severity: 'success'
        });
        
        // Redireciona para a ficha do paciente após o sucesso
        setTimeout(() => {
          navigate(`/ficha-paciente/${response.data.pacienteId}`);
        }, 2000);
      }
    } catch (error) {
      console.error('Erro ao cadastrar paciente:', error);
      setSnackbar({
        open: true,
        message: error.response?.data?.message || 'Erro ao cadastrar paciente. Tente novamente.',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar({
      ...snackbar,
      open: false
    });
  };

  return (
    <Box sx={{ p: 2 }}>
      <Paper elevation={0} sx={{ p: 2, mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <PersonIcon sx={{ fontSize: 32, mr: 1, color: 'primary.main' }} />
            <Typography variant="h4">Cadastro de Paciente</Typography>
          </Box>
          <Button 
            startIcon={<ArrowBackIcon />} 
            onClick={() => navigate(-1)}
          >
            Voltar
          </Button>
        </Box>

        <Divider sx={{ mb: 3 }} />

        <Box sx={{ mb: 3 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={6} md={9}>
              <Typography variant="body1">
                Importe dados do paciente através de um arquivo do Word ou Excel, ou preencha o formulário manualmente.
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button
                  component="label"
                  variant="outlined"
                  startIcon={<UploadIcon />}
                  disabled={loading}
                >
                  Selecionar Arquivo
                  <input
                    type="file"
                    hidden
                    accept=".docx,.xls,.xlsx"
                    onChange={handleFileChange}
                  />
                </Button>
                <Button 
                  variant="contained" 
                  onClick={handleFileUpload}
                  disabled={!file || loading}
                >
                  Importar
                </Button>
              </Box>
              {file && (
                <Typography variant="caption" sx={{ display: 'block', mt: 1 }}>
                  Arquivo selecionado: {file.name}
                </Typography>
              )}
            </Grid>
          </Grid>
        </Box>

        <form onSubmit={handleSubmit}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Informações Pessoais</Typography>
              <Divider sx={{ mb: 3 }} />
              
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6} md={4}>
                  <TextField
                    label="Nome Completo"
                    name="nome"
                    value={formData.nome}
                    onChange={handleInputChange}
                    fullWidth
                    required
                    margin="normal"
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                  <TextField
                    label="Data de Nascimento"
                    name="dataNascimento"
                    type="date"
                    value={formData.dataNascimento}
                    onChange={handleInputChange}
                    fullWidth
                    required
                    margin="normal"
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                  <TextField
                    label="CPF"
                    name="cpf"
                    value={formData.cpf}
                    onChange={handleInputChange}
                    fullWidth
                    required
                    margin="normal"
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                  <TextField
                    label="RG"
                    name="rg"
                    value={formData.rg}
                    onChange={handleInputChange}
                    fullWidth
                    margin="normal"
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                  <FormControl fullWidth margin="normal">
                    <InputLabel>Gênero</InputLabel>
                    <Select
                      name="genero"
                      value={formData.genero}
                      onChange={handleInputChange}
                      label="Gênero"
                    >
                      <MenuItem value="masculino">Masculino</MenuItem>
                      <MenuItem value="feminino">Feminino</MenuItem>
                      <MenuItem value="outro">Outro</MenuItem>
                      <MenuItem value="nao_informado">Prefiro não informar</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                  <FormControl fullWidth margin="normal">
                    <InputLabel>Estado Civil</InputLabel>
                    <Select
                      name="estadoCivil"
                      value={formData.estadoCivil}
                      onChange={handleInputChange}
                      label="Estado Civil"
                    >
                      <MenuItem value="solteiro">Solteiro(a)</MenuItem>
                      <MenuItem value="casado">Casado(a)</MenuItem>
                      <MenuItem value="divorciado">Divorciado(a)</MenuItem>
                      <MenuItem value="viuvo">Viúvo(a)</MenuItem>
                      <MenuItem value="outro">Outro</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          <Card sx={{ mt: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>Contato</Typography>
              <Divider sx={{ mb: 3 }} />
              
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6} md={4}>
                  <TextField
                    label="Telefone"
                    name="telefone"
                    value={formData.telefone}
                    onChange={handleInputChange}
                    fullWidth
                    margin="normal"
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                  <TextField
                    label="Celular"
                    name="celular"
                    value={formData.celular}
                    onChange={handleInputChange}
                    fullWidth
                    margin="normal"
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                  <TextField
                    label="E-mail"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    fullWidth
                    margin="normal"
                  />
                </Grid>
              </Grid>
              
              <Typography variant="subtitle1" sx={{ mt: 2, mb: 1 }}>Endereço</Typography>
              
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6} md={6}>
                  <TextField
                    label="Logradouro"
                    name="endereco.logradouro"
                    value={formData.endereco.logradouro}
                    onChange={handleInputChange}
                    fullWidth
                    margin="normal"
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={2}>
                  <TextField
                    label="Número"
                    name="endereco.numero"
                    value={formData.endereco.numero}
                    onChange={handleInputChange}
                    fullWidth
                    margin="normal"
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                  <TextField
                    label="Complemento"
                    name="endereco.complemento"
                    value={formData.endereco.complemento}
                    onChange={handleInputChange}
                    fullWidth
                    margin="normal"
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                  <TextField
                    label="Bairro"
                    name="endereco.bairro"
                    value={formData.endereco.bairro}
                    onChange={handleInputChange}
                    fullWidth
                    margin="normal"
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                  <TextField
                    label="Cidade"
                    name="endereco.cidade"
                    value={formData.endereco.cidade}
                    onChange={handleInputChange}
                    fullWidth
                    margin="normal"
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={2}>
                  <TextField
                    label="Estado"
                    name="endereco.estado"
                    value={formData.endereco.estado}
                    onChange={handleInputChange}
                    fullWidth
                    margin="normal"
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={2}>
                  <TextField
                    label="CEP"
                    name="endereco.cep"
                    value={formData.endereco.cep}
                    onChange={handleInputChange}
                    fullWidth
                    margin="normal"
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          <Card sx={{ mt: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>Informações Médicas</Typography>
              <Divider sx={{ mb: 3 }} />
              
              <Typography variant="subtitle1" sx={{ mt: 2, mb: 1 }}>Convênio</Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6} md={4}>
                  <TextField
                    label="Nome do Convênio"
                    name="convenio.nome"
                    value={formData.convenio.nome}
                    onChange={handleInputChange}
                    fullWidth
                    margin="normal"
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                  <TextField
                    label="Número da Carteirinha"
                    name="convenio.numero"
                    value={formData.convenio.numero}
                    onChange={handleInputChange}
                    fullWidth
                    margin="normal"
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                  <TextField
                    label="Validade"
                    name="convenio.validade"
                    type="date"
                    value={formData.convenio.validade}
                    onChange={handleInputChange}
                    fullWidth
                    margin="normal"
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
              </Grid>
              
              <Typography variant="subtitle1" sx={{ mt: 2, mb: 1 }}>Contato de Emergência</Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6} md={4}>
                  <TextField
                    label="Nome"
                    name="emergencia.nome"
                    value={formData.emergencia.nome}
                    onChange={handleInputChange}
                    fullWidth
                    margin="normal"
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                  <TextField
                    label="Telefone"
                    name="emergencia.telefone"
                    value={formData.emergencia.telefone}
                    onChange={handleInputChange}
                    fullWidth
                    margin="normal"
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                  <TextField
                    label="Relação"
                    name="emergencia.relacao"
                    value={formData.emergencia.relacao}
                    onChange={handleInputChange}
                    fullWidth
                    margin="normal"
                  />
                </Grid>
              </Grid>
              
              <Typography variant="subtitle1" sx={{ mt: 2, mb: 1 }}>Histórico Médico</Typography>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    label="Alergias"
                    name="alergias"
                    value={formData.alergias}
                    onChange={handleInputChange}
                    fullWidth
                    multiline
                    rows={2}
                    margin="normal"
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    label="Medicações em Uso"
                    name="medicacoes"
                    value={formData.medicacoes}
                    onChange={handleInputChange}
                    fullWidth
                    multiline
                    rows={2}
                    margin="normal"
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    label="Doenças Crônicas"
                    name="doencasCronicas"
                    value={formData.doencasCronicas}
                    onChange={handleInputChange}
                    fullWidth
                    multiline
                    rows={2}
                    margin="normal"
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    label="Cirurgias Anteriores"
                    name="cirurgias"
                    value={formData.cirurgias}
                    onChange={handleInputChange}
                    fullWidth
                    multiline
                    rows={2}
                    margin="normal"
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    label="Histórico Familiar"
                    name="historicoFamiliar"
                    value={formData.historicoFamiliar}
                    onChange={handleInputChange}
                    fullWidth
                    multiline
                    rows={2}
                    margin="normal"
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center' }}>
            <Button 
              type="submit"
              variant="contained" 
              size="large"
              startIcon={<SaveIcon />}
              disabled={loading}
              sx={{ px: 4, py: 1 }}
            >
              {loading ? (
                <>
                  <CircularProgress size={24} sx={{ mr: 1 }} />
                  Salvando...
                </>
              ) : 'Salvar Cadastro'}
            </Button>
          </Box>
        </form>
      </Paper>

      <Snackbar 
        open={snackbar.open} 
        autoHideDuration={6000} 
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default CadastroPaciente; 