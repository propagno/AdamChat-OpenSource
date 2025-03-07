import React, { useState, useEffect } from 'react';
import { 
  Container, 
  Typography, 
  Box, 
  Tabs, 
  Tab, 
  Paper,
  TextField,
  Button,
  Alert,
  CircularProgress,
  Divider,
  List,
  ListItem,
  ListItemText,
  Card,
  CardContent,
  Grid
} from '@mui/material';
import PatientForm from './PatientForm';
import MedicalFileUpload from './MedicalFileUpload';
import ProntuarioForm from './ProntuarioForm';
import { patientsService } from '../../services/patients';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

// Componente TabPanel para mostrar o conteúdo das abas
function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`patient-tabpanel-${index}`}
      aria-labelledby={`patient-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const PatientManagement = () => {
  const [tabValue, setTabValue] = useState(0);
  const [searchCpf, setSearchCpf] = useState('');
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState(null);
  const [currentPatient, setCurrentPatient] = useState(null);
  const [patientHistory, setPatientHistory] = useState(null);
  const [historyLoading, setHistoryLoading] = useState(false);
  
  // Troca de aba
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };
  
  // Pesquisa paciente por CPF
  const handleSearch = async () => {
    if (!searchCpf) {
      setSearchError('Por favor, informe o CPF do paciente');
      return;
    }
    
    setSearchLoading(true);
    setSearchError(null);
    
    try {
      const patient = await patientsService.getPatientByCpf(searchCpf);
      setCurrentPatient(patient);
      
      // Após encontrar o paciente, obter o histórico
      if (patient && patient._id) {
        await fetchPatientHistory(patient._id);
      }
      
      // Muda para a aba de visualização do paciente
      setTabValue(3);
    } catch (err) {
      if (err.response && err.response.status === 404) {
        setSearchError('Paciente não encontrado com este CPF');
      } else {
        setSearchError(err.response?.data?.error || 'Erro ao buscar paciente');
      }
      setCurrentPatient(null);
      setPatientHistory(null);
    } finally {
      setSearchLoading(false);
    }
  };
  
  // Busca o histórico de prontuários do paciente
  const fetchPatientHistory = async (patientId) => {
    setHistoryLoading(true);
    
    try {
      const history = await patientsService.getPatientHistory(patientId);
      setPatientHistory(history);
    } catch (err) {
      console.error('Erro ao buscar histórico do paciente:', err);
    } finally {
      setHistoryLoading(false);
    }
  };
  
  // Quando um paciente é criado com sucesso
  const handlePatientCreated = (result) => {
    // Resetar estado atual
    setCurrentPatient(null);
    setPatientHistory(null);
    
    // Buscar o paciente recém-criado
    if (result && result.patient_id) {
      patientsService.getPatientById(result.patient_id)
        .then(patient => {
          setCurrentPatient(patient);
          fetchPatientHistory(result.patient_id);
          setTabValue(3); // Mudar para a aba de visualização
        })
        .catch(err => {
          console.error('Erro ao buscar paciente criado:', err);
        });
    }
  };
  
  // Quando um prontuário é adicionado com sucesso
  const handleProntuarioCreated = () => {
    // Atualizar o histórico do paciente
    if (currentPatient && currentPatient._id) {
      fetchPatientHistory(currentPatient._id);
    }
  };
  
  // Quando um arquivo é processado com sucesso
  const handleFileProcessed = (result) => {
    // Se o resultado inclui informações sobre o paciente criado, atualizar estado
    if (result.patient_result && !result.patient_result.error) {
      // Buscar o paciente recém-criado
      patientsService.getPatientById(result.patient_result.patient_id)
        .then(patient => {
          setCurrentPatient(patient);
          fetchPatientHistory(result.patient_result.patient_id);
          setTabValue(3); // Mudar para a aba de visualização
        })
        .catch(err => {
          console.error('Erro ao buscar paciente criado:', err);
        });
    } 
    // Se foi apenas adicionado um prontuário a um paciente existente
    else if (result.patient_record_result && !result.patient_record_result.error) {
      // Atualizar o histórico
      if (currentPatient && currentPatient._id) {
        fetchPatientHistory(currentPatient._id);
      }
    }
  };
  
  // Formatar CPF enquanto digita
  const formatCPF = (value) => {
    const cpfClean = value.replace(/[^\d]/g, '');
    
    if (cpfClean.length <= 3) {
      return cpfClean;
    } else if (cpfClean.length <= 6) {
      return `${cpfClean.slice(0, 3)}.${cpfClean.slice(3)}`;
    } else if (cpfClean.length <= 9) {
      return `${cpfClean.slice(0, 3)}.${cpfClean.slice(3, 6)}.${cpfClean.slice(6)}`;
    } else {
      return `${cpfClean.slice(0, 3)}.${cpfClean.slice(3, 6)}.${cpfClean.slice(6, 9)}-${cpfClean.slice(9, 11)}`;
    }
  };
  
  const handleCPFChange = (e) => {
    setSearchCpf(formatCPF(e.target.value));
  };
  
  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom>
        Gerenciamento de Pacientes
      </Typography>
      
      <Box sx={{ mb: 3 }}>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Buscar Paciente
          </Typography>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <TextField
              label="CPF do Paciente"
              value={searchCpf}
              onChange={handleCPFChange}
              variant="outlined"
              placeholder="000.000.000-00"
              inputProps={{ maxLength: 14 }}
              error={!!searchError}
              helperText={searchError}
              sx={{ flexGrow: 1 }}
            />
            <Button 
              variant="contained" 
              onClick={handleSearch}
              disabled={searchLoading}
            >
              {searchLoading ? <CircularProgress size={24} /> : 'Buscar'}
            </Button>
          </Box>
        </Paper>
      </Box>
      
      <Paper>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={handleTabChange} aria-label="Abas de gerenciamento de pacientes">
            <Tab label="Cadastrar Paciente" id="patient-tab-0" />
            <Tab label="Upload de Ficha" id="patient-tab-1" />
            {currentPatient && <Tab label="Adicionar Prontuário" id="patient-tab-2" />}
            {currentPatient && <Tab label="Visualizar Paciente" id="patient-tab-3" />}
          </Tabs>
        </Box>
        
        <TabPanel value={tabValue} index={0}>
          <PatientForm onPatientCreated={handlePatientCreated} />
        </TabPanel>
        
        <TabPanel value={tabValue} index={1}>
          <MedicalFileUpload 
            onFileProcessed={handleFileProcessed} 
            patientId={currentPatient?._id}
          />
        </TabPanel>
        
        {currentPatient && (
          <TabPanel value={tabValue} index={2}>
            <ProntuarioForm 
              patientId={currentPatient._id} 
              patientData={currentPatient}
              onProntuarioCreated={handleProntuarioCreated}
            />
          </TabPanel>
        )}
        
        {currentPatient && (
          <TabPanel value={tabValue} index={3}>
            <Box>
              <Typography variant="h6" gutterBottom>
                Dados do Paciente
              </Typography>
              
              <Grid container spacing={2} sx={{ mb: 4 }}>
                <Grid item xs={12} md={6}>
                  <Paper sx={{ p: 2 }}>
                    <Typography variant="subtitle1" gutterBottom>
                      <strong>Nome:</strong> {currentPatient.nome}
                    </Typography>
                    <Typography variant="body1">
                      <strong>CPF:</strong> {currentPatient.cpf}
                    </Typography>
                    <Typography variant="body1">
                      <strong>Idade:</strong> {currentPatient.idade} anos
                    </Typography>
                    <Typography variant="body1">
                      <strong>Gênero:</strong> {currentPatient.genero}
                    </Typography>
                    {currentPatient.data_cadastro && (
                      <Typography variant="body2" sx={{ mt: 1, color: 'text.secondary' }}>
                        <strong>Cadastrado em:</strong> {new Date(currentPatient.data_cadastro).toLocaleDateString()}
                      </Typography>
                    )}
                  </Paper>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Paper sx={{ p: 2, height: '100%', display: 'flex', flexDirection: 'column' }}>
                    <Typography variant="subtitle1" gutterBottom>
                      Ações
                    </Typography>
                    <Box sx={{ mt: 2 }}>
                      <Button 
                        variant="contained" 
                        color="primary" 
                        sx={{ mr: 2 }}
                        onClick={() => setTabValue(2)}
                      >
                        Adicionar Prontuário
                      </Button>
                      <Button 
                        variant="outlined"
                        onClick={() => setTabValue(1)}
                      >
                        Upload de Ficha
                      </Button>
                    </Box>
                  </Paper>
                </Grid>
              </Grid>
              
              <Typography variant="h6" gutterBottom>
                Histórico de Prontuários
              </Typography>
              
              {historyLoading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                  <CircularProgress />
                </Box>
              ) : patientHistory && patientHistory.prontuarios && patientHistory.prontuarios.length > 0 ? (
                <List>
                  {patientHistory.prontuarios.map((prontuario, index) => (
                    <Card key={index} sx={{ mb: 2 }}>
                      <CardContent>
                        <Typography variant="h6" gutterBottom>
                          Consulta: {new Date(prontuario.dataConsulta).toLocaleDateString()}
                        </Typography>
                        
                        <Typography variant="subtitle1" gutterBottom>
                          <strong>Sintomas:</strong>
                        </Typography>
                        <Typography variant="body1" paragraph>
                          {prontuario.sintomas}
                        </Typography>
                        
                        <Typography variant="subtitle1" gutterBottom>
                          <strong>Histórico Médico:</strong>
                        </Typography>
                        <Typography variant="body1" paragraph>
                          {prontuario.historicoMedico}
                        </Typography>
                        
                        {prontuario.relatorio && (
                          <>
                            <Typography variant="subtitle1" gutterBottom>
                              <strong>Relatório Médico:</strong>
                            </Typography>
                            <Paper elevation={0} sx={{ p: 2, bgcolor: '#f9f9f9' }}>
                              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                {prontuario.relatorio}
                              </ReactMarkdown>
                            </Paper>
                          </>
                        )}
                        
                        <Typography variant="body2" sx={{ mt: 2, color: 'text.secondary' }}>
                          <strong>Registrado em:</strong> {new Date(prontuario.data_criacao).toLocaleString()}
                        </Typography>
                      </CardContent>
                    </Card>
                  ))}
                </List>
              ) : (
                <Alert severity="info">
                  Nenhum prontuário encontrado para este paciente.
                </Alert>
              )}
            </Box>
          </TabPanel>
        )}
      </Paper>
    </Container>
  );
};

export default PatientManagement; 