import React, { useState } from 'react';
import { 
  Box, 
  Button, 
  TextField, 
  Typography, 
  Paper, 
  Grid, 
  Alert, 
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Switch
} from '@mui/material';
import { patientsService } from '../../services/patients';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const ProntuarioForm = ({ patientId, patientData, onProntuarioCreated }) => {
  const [formData, setFormData] = useState({
    dataConsulta: new Date().toISOString().split('T')[0],
    sintomas: '',
    historicoMedico: '',
    ai_provider: 'chatgpt'
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [aiEnabled, setAiEnabled] = useState(true);
  const [generatedReport, setGeneratedReport] = useState(null);
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const validateForm = () => {
    if (!formData.dataConsulta || !formData.sintomas || !formData.historicoMedico) {
      setError('Todos os campos são obrigatórios');
      return false;
    }
    
    return true;
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    setGeneratedReport(null);
    
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);
    
    try {
      // Se AI está habilitada, inclui o provedor
      const prontuarioData = { ...formData };
      
      if (!aiEnabled) {
        delete prontuarioData.ai_provider;
      }
      
      const result = await patientsService.addProntuario(patientId, prontuarioData);
      
      if (result.error) {
        setError(result.error);
      } else {
        setSuccess(true);
        
        // Se o resultado inclui um prontuário com relatório, exibe-o
        if (result.prontuario && result.prontuario.relatorio) {
          setGeneratedReport(result.prontuario.relatorio);
        }
        
        // Notifica o componente pai
        if (onProntuarioCreated) {
          onProntuarioCreated(result);
        }
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Erro ao cadastrar prontuário');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
      <Typography variant="h6" component="h2" gutterBottom>
        Adicionar Prontuário Médico
      </Typography>
      
      {patientData && (
        <Box sx={{ mb: 3, p: 2, bgcolor: 'background.paper', borderRadius: 1 }}>
          <Typography variant="subtitle1" gutterBottom>
            <strong>Paciente:</strong> {patientData.nome}
          </Typography>
          {patientData.idade && (
            <Typography variant="body2">
              <strong>Idade:</strong> {patientData.idade} anos
            </Typography>
          )}
          {patientData.genero && (
            <Typography variant="body2">
              <strong>Gênero:</strong> {patientData.genero}
            </Typography>
          )}
        </Box>
      )}
      
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      
      {success && (
        <Alert severity="success" sx={{ mb: 2 }}>
          Prontuário cadastrado com sucesso!
        </Alert>
      )}
      
      <form onSubmit={handleSubmit}>
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Data da Consulta"
              name="dataConsulta"
              type="date"
              value={formData.dataConsulta}
              onChange={handleChange}
              InputLabelProps={{ shrink: true }}
              required
            />
          </Grid>
          
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Sintomas"
              name="sintomas"
              value={formData.sintomas}
              onChange={handleChange}
              multiline
              rows={3}
              variant="outlined"
              required
              placeholder="Descreva os sintomas apresentados pelo paciente"
            />
          </Grid>
          
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Histórico Médico"
              name="historicoMedico"
              value={formData.historicoMedico}
              onChange={handleChange}
              multiline
              rows={4}
              variant="outlined"
              required
              placeholder="Informe o histórico médico relevante do paciente"
            />
          </Grid>
          
          <Grid item xs={12} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <FormControlLabel
              control={
                <Switch
                  checked={aiEnabled}
                  onChange={(e) => setAiEnabled(e.target.checked)}
                  color="primary"
                />
              }
              label="Gerar relatório com IA"
            />
            
            {aiEnabled && (
              <FormControl sx={{ minWidth: 200 }}>
                <InputLabel id="ai-provider-label">Provedor de IA</InputLabel>
                <Select
                  labelId="ai-provider-label"
                  name="ai_provider"
                  value={formData.ai_provider}
                  onChange={handleChange}
                  label="Provedor de IA"
                  required={aiEnabled}
                >
                  <MenuItem value="chatgpt">ChatGPT</MenuItem>
                  <MenuItem value="gemini">Gemini</MenuItem>
                  <MenuItem value="claude">Claude</MenuItem>
                  <MenuItem value="deepseek">DeepSeek</MenuItem>
                  <MenuItem value="llama">Llama</MenuItem>
                  <MenuItem value="copilot">Copilot</MenuItem>
                </Select>
              </FormControl>
            )}
          </Grid>
          
          <Grid item xs={12}>
            <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
              <Button 
                type="submit" 
                variant="contained" 
                color="primary"
                disabled={loading}
              >
                {loading ? <CircularProgress size={24} /> : 'Cadastrar Prontuário'}
              </Button>
            </Box>
          </Grid>
        </Grid>
      </form>
      
      {generatedReport && (
        <Box sx={{ mt: 4, p: 2, bgcolor: '#f9f9f9', borderRadius: 1 }}>
          <Typography variant="h6" gutterBottom>
            Relatório Médico Gerado
          </Typography>
          
          <Paper elevation={1} sx={{ p: 2, bgcolor: '#fff' }}>
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {generatedReport}
            </ReactMarkdown>
          </Paper>
        </Box>
      )}
    </Paper>
  );
};

export default ProntuarioForm; 