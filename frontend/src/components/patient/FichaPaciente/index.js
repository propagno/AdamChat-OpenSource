import React, { useState } from 'react';
import { 
  Typography, 
  Box, 
  Card, 
  CardContent, 
  TextField, 
  Grid, 
  Button, 
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Tabs,
  Tab,
  IconButton
} from '@mui/material';
import {
  Save as SaveIcon,
  Edit as EditIcon,
  Search as SearchIcon,
  Print as PrintIcon,
  History as HistoryIcon
} from '@mui/icons-material';

// Mock data para simulação
const mockPatientData = {
  nome: 'João Silva',
  dataNascimento: '15/05/1985',
  cpf: '123.456.789-00',
  telefone: '(11) 98765-4321',
  endereco: 'Rua das Flores, 123 - São Paulo, SP',
  historico: [
    { data: '10/01/2023', medico: 'Dra. Ana Santos', descricao: 'Consulta de rotina. Paciente relata dores nas costas.' },
    { data: '25/02/2023', medico: 'Dr. Carlos Oliveira', descricao: 'Retorno. Melhora dos sintomas após medicação.' }
  ]
};

const FichaPaciente = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [patientData, setPatientData] = useState(mockPatientData);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState(mockPatientData);

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const handleSearch = () => {
    console.log("Buscando paciente:", searchTerm);
    // Aqui seria implementada a busca real no backend
  };

  const handleEditToggle = () => {
    if (isEditing) {
      setPatientData(formData);
    }
    setIsEditing(!isEditing);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" gutterBottom>Ficha do Paciente</Typography>
        
        <Box sx={{ display: 'flex', gap: 2 }}>
          <TextField
            size="small"
            label="Buscar Paciente"
            variant="outlined"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <Button 
            variant="contained" 
            startIcon={<SearchIcon />}
            onClick={handleSearch}
          >
            Buscar
          </Button>
        </Box>
      </Box>

      <Tabs value={activeTab} onChange={handleTabChange} sx={{ mb: 2 }}>
        <Tab label="Informações Pessoais" />
        <Tab label="Histórico Médico" />
        <Tab label="Exames" />
      </Tabs>

      {activeTab === 0 && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
              <Typography variant="h6">Dados Pessoais</Typography>
              <Box>
                <IconButton onClick={handleEditToggle}>
                  {isEditing ? <SaveIcon /> : <EditIcon />}
                </IconButton>
                <IconButton>
                  <PrintIcon />
                </IconButton>
              </Box>
            </Box>
            <Divider sx={{ mb: 2 }} />
            
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Nome Completo"
                  name="nome"
                  value={isEditing ? formData.nome : patientData.nome}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  margin="normal"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Data de Nascimento"
                  name="dataNascimento"
                  value={isEditing ? formData.dataNascimento : patientData.dataNascimento}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  margin="normal"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="CPF"
                  name="cpf"
                  value={isEditing ? formData.cpf : patientData.cpf}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  margin="normal"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Telefone"
                  name="telefone"
                  value={isEditing ? formData.telefone : patientData.telefone}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  margin="normal"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Endereço"
                  name="endereco"
                  value={isEditing ? formData.endereco : patientData.endereco}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  margin="normal"
                />
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      )}

      {activeTab === 1 && (
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
              <Typography variant="h6">Histórico de Consultas</Typography>
              <IconButton>
                <HistoryIcon />
              </IconButton>
            </Box>
            <Divider sx={{ mb: 2 }} />
            
            <TableContainer component={Paper} sx={{ mb: 3 }}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Data</TableCell>
                    <TableCell>Médico</TableCell>
                    <TableCell>Descrição</TableCell>
                    <TableCell>Ações</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {patientData.historico.map((record, index) => (
                    <TableRow key={index}>
                      <TableCell>{record.data}</TableCell>
                      <TableCell>{record.medico}</TableCell>
                      <TableCell>{record.descricao}</TableCell>
                      <TableCell>
                        <IconButton size="small">
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            
            <Button 
              variant="contained" 
              startIcon={<SaveIcon />}
            >
              Adicionar Nova Consulta
            </Button>
          </CardContent>
        </Card>
      )}

      {activeTab === 2 && (
        <Card>
          <CardContent>
            <Typography variant="h6">Exames</Typography>
            <Divider sx={{ my: 2 }} />
            <Typography variant="body1">
              Nenhum exame registrado para este paciente.
            </Typography>
            <Button 
              variant="contained" 
              sx={{ mt: 2 }}
              startIcon={<SaveIcon />}
            >
              Adicionar Novo Exame
            </Button>
          </CardContent>
        </Card>
      )}
    </Box>
  );
};

export default FichaPaciente;
