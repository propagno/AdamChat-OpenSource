import React, { useState } from 'react';
import { 
  Box, 
  Button, 
  Typography, 
  Paper, 
  Grid, 
  Alert, 
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Checkbox,
  FormControlLabel
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import { styled } from '@mui/material/styles';
import { patientsService } from '../../services/patients';

// Estilização do componente de upload
const VisuallyHiddenInput = styled('input')({
  clip: 'rect(0 0 0 0)',
  clipPath: 'inset(50%)',
  height: 1,
  overflow: 'hidden',
  position: 'absolute',
  bottom: 0,
  left: 0,
  whiteSpace: 'nowrap',
  width: 1,
});

const MedicalFileUpload = ({ onFileProcessed, patientId = null }) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [aiProvider, setAiProvider] = useState('chatgpt');
  const [createPatientRecord, setCreatePatientRecord] = useState(true);
  const [consultaDate, setConsultaDate] = useState(new Date().toISOString().split('T')[0]);
  const [processedData, setProcessedData] = useState(null);
  
  const handleFileChange = (event) => {
    const file = event.target.files[0];
    
    if (file) {
      // Verifica o tipo de arquivo
      const fileType = file.name.split('.').pop().toLowerCase();
      
      if (['docx', 'xlsx', 'xls'].includes(fileType)) {
        setSelectedFile(file);
        setError(null);
      } else {
        setError('Tipo de arquivo não suportado. Por favor, selecione um arquivo .docx, .xlsx ou .xls');
        setSelectedFile(null);
      }
    }
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedFile) {
      setError('Por favor, selecione um arquivo para upload');
      return;
    }
    
    setLoading(true);
    setError(null);
    setSuccess(false);
    setProcessedData(null);
    
    try {
      // Configura opções para o upload
      const options = {
        ai_provider: aiProvider,
        create_patient_record: createPatientRecord,
        data_consulta: consultaDate
      };
      
      // Se for atualização de paciente existente, inclui o ID
      if (patientId) {
        options.patient_id = patientId;
      }
      
      // Faz o upload do arquivo
      const result = await patientsService.uploadMedicalFile(selectedFile, options);
      
      if (result.error) {
        setError(result.error);
      } else {
        setSuccess(true);
        setProcessedData(result);
        
        // Notifica o componente pai
        if (onFileProcessed) {
          onFileProcessed(result);
        }
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Erro ao processar arquivo');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
      <Typography variant="h6" component="h2" gutterBottom>
        {patientId ? 'Adicionar Ficha Médica ao Paciente' : 'Upload de Ficha Médica'}
      </Typography>
      
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      
      {success && (
        <Alert severity="success" sx={{ mb: 2 }}>
          Arquivo processado com sucesso!
        </Alert>
      )}
      
      <form onSubmit={handleSubmit}>
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Button
                component="label"
                variant="contained"
                startIcon={<CloudUploadIcon />}
                disabled={loading}
              >
                Selecionar Arquivo
                <VisuallyHiddenInput type="file" onChange={handleFileChange} accept=".docx,.xlsx,.xls" />
              </Button>
              {selectedFile && (
                <Typography variant="body2">
                  {selectedFile.name}
                </Typography>
              )}
            </Box>
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel id="ai-provider-label">Provedor de IA</InputLabel>
              <Select
                labelId="ai-provider-label"
                value={aiProvider}
                onChange={(e) => setAiProvider(e.target.value)}
                label="Provedor de IA"
              >
                <MenuItem value="chatgpt">ChatGPT</MenuItem>
                <MenuItem value="gemini">Gemini</MenuItem>
                <MenuItem value="claude">Claude</MenuItem>
                <MenuItem value="deepseek">DeepSeek</MenuItem>
                <MenuItem value="llama">Llama</MenuItem>
                <MenuItem value="copilot">Copilot</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Data da Consulta"
              type="date"
              value={consultaDate}
              onChange={(e) => setConsultaDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          
          <Grid item xs={12}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={createPatientRecord}
                  onChange={(e) => setCreatePatientRecord(e.target.checked)}
                  color="primary"
                />
              }
              label={patientId ? "Adicionar prontuário ao paciente" : "Criar registro de paciente a partir do arquivo"}
            />
          </Grid>
          
          <Grid item xs={12}>
            <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
              <Button 
                type="submit" 
                variant="contained" 
                color="primary"
                disabled={loading || !selectedFile}
              >
                {loading ? <CircularProgress size={24} /> : 'Processar Arquivo'}
              </Button>
            </Box>
          </Grid>
        </Grid>
      </form>
      
      {processedData && (
        <Box sx={{ mt: 3 }}>
          <Typography variant="h6" gutterBottom>
            Dados Extraídos
          </Typography>
          
          {processedData.patient_data && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle1">Dados do Paciente:</Typography>
              <pre>
                {JSON.stringify(processedData.patient_data, null, 2)}
              </pre>
            </Box>
          )}
          
          {processedData.extracted_data && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle1">Dados Extraídos do Arquivo:</Typography>
              <pre>
                {JSON.stringify(processedData.extracted_data, null, 2)}
              </pre>
            </Box>
          )}
          
          {processedData.ai_extracted && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle1">Dados Extraídos pela IA:</Typography>
              <pre>
                {typeof processedData.ai_extracted === 'string' 
                  ? processedData.ai_extracted 
                  : JSON.stringify(processedData.ai_extracted, null, 2)}
              </pre>
            </Box>
          )}
        </Box>
      )}
    </Paper>
  );
};

export default MedicalFileUpload; 