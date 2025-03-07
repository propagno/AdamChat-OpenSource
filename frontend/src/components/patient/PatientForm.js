import React, { useState } from 'react';
import { 
  Box, 
  Button, 
  TextField, 
  Typography, 
  Paper, 
  Grid, 
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress
} from '@mui/material';
import { patientsService } from '../../services/patients';

const PatientForm = ({ onPatientCreated }) => {
  const [formData, setFormData] = useState({
    nome: '',
    idade: '',
    genero: '',
    cpf: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const validateForm = () => {
    // Validações básicas
    if (!formData.nome || !formData.idade || !formData.genero || !formData.cpf) {
      setError('Todos os campos são obrigatórios');
      return false;
    }
    
    // Validação de CPF (simplificada)
    const cpfClean = formData.cpf.replace(/[^\d]/g, '');
    if (cpfClean.length !== 11) {
      setError('CPF inválido. Deve conter 11 dígitos');
      return false;
    }
    
    // Validação de idade
    const age = parseInt(formData.idade);
    if (isNaN(age) || age <= 0 || age > 150) {
      setError('Idade inválida');
      return false;
    }
    
    return true;
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);
    
    try {
      // Formatando dados antes de enviar
      const patientData = {
        ...formData,
        idade: parseInt(formData.idade)
      };
      
      const result = await patientsService.createPatient(patientData);
      
      if (result.error) {
        setError(result.error);
      } else {
        setSuccess(true);
        setFormData({
          nome: '',
          idade: '',
          genero: '',
          cpf: ''
        });
        
        // Notifica o componente pai sobre a criação do paciente
        if (onPatientCreated) {
          onPatientCreated(result);
        }
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Erro ao cadastrar paciente');
    } finally {
      setLoading(false);
    }
  };
  
  // Formatar CPF enquanto digita (XXX.XXX.XXX-XX)
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
    const { value } = e.target;
    setFormData(prev => ({ 
      ...prev, 
      cpf: formatCPF(value)
    }));
  };
  
  return (
    <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
      <Typography variant="h6" component="h2" gutterBottom>
        Cadastro de Paciente
      </Typography>
      
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      
      {success && (
        <Alert severity="success" sx={{ mb: 2 }}>
          Paciente cadastrado com sucesso!
        </Alert>
      )}
      
      <form onSubmit={handleSubmit}>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Nome Completo"
              name="nome"
              value={formData.nome}
              onChange={handleChange}
              variant="outlined"
              required
            />
          </Grid>
          
          <Grid item xs={12} sm={3}>
            <TextField
              fullWidth
              label="Idade"
              name="idade"
              type="number"
              value={formData.idade}
              onChange={handleChange}
              variant="outlined"
              required
              inputProps={{ min: 0, max: 150 }}
            />
          </Grid>
          
          <Grid item xs={12} sm={3}>
            <FormControl fullWidth>
              <InputLabel id="genero-label">Gênero</InputLabel>
              <Select
                labelId="genero-label"
                name="genero"
                value={formData.genero}
                onChange={handleChange}
                label="Gênero"
                required
              >
                <MenuItem value="masculino">Masculino</MenuItem>
                <MenuItem value="feminino">Feminino</MenuItem>
                <MenuItem value="outro">Outro</MenuItem>
                <MenuItem value="nao_informado">Prefiro não informar</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="CPF"
              name="cpf"
              value={formData.cpf}
              onChange={handleCPFChange}
              variant="outlined"
              required
              placeholder="000.000.000-00"
              inputProps={{ maxLength: 14 }}
            />
          </Grid>
          
          <Grid item xs={12}>
            <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
              <Button 
                type="submit" 
                variant="contained" 
                color="primary"
                disabled={loading}
              >
                {loading ? <CircularProgress size={24} /> : 'Cadastrar Paciente'}
              </Button>
            </Box>
          </Grid>
        </Grid>
      </form>
    </Paper>
  );
};

export default PatientForm; 