import React, { useState } from 'react';
import { Box, Button, Typography, Paper, Collapse, TextField } from '@mui/material';
import { styled } from '@mui/material/styles';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import RefreshIcon from '@mui/icons-material/Refresh';
import ReportProblemIcon from '@mui/icons-material/ReportProblem';
import HomeIcon from '@mui/icons-material/Home';
import { Link } from 'react-router-dom';

// Estilização do contêiner principal
const ErrorContainer = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(4),
  margin: theme.spacing(2),
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  textAlign: 'center',
  borderRadius: theme.shape.borderRadius * 2,
  boxShadow: theme.shadows[3],
  backgroundColor: theme.palette.background.paper,
}));

// Estilização do ícone de erro
const StyledErrorIcon = styled(ErrorOutlineIcon)(({ theme }) => ({
  fontSize: 64,
  color: theme.palette.error.main,
  marginBottom: theme.spacing(2),
}));

/**
 * Componente para exibir erros de forma amigável
 * Usado pelo ErrorBoundary para capturar erros de renderização
 * 
 * @param {Object} props - Propriedades do componente
 * @param {Error} props.error - Objeto de erro
 * @param {Function} props.resetErrorBoundary - Função para resetar o ErrorBoundary
 */
const ErrorFallback = ({ error, resetErrorBoundary }) => {
  const [showDetails, setShowDetails] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [feedbackSent, setFeedbackSent] = useState(false);
  
  // Enviar feedback sobre o erro
  const handleSubmitFeedback = () => {
    // Aqui você poderia implementar o envio do feedback para um serviço
    // de registro de erros como Sentry, LogRocket, etc.
    console.log('Feedback enviado:', {
      feedback,
      error: error.toString(),
      stack: error.stack
    });
    
    setFeedbackSent(true);
  };
  
  return (
    <ErrorContainer>
      <StyledErrorIcon />
      
      <Typography variant="h5" component="h2" gutterBottom>
        Algo deu errado
      </Typography>
      
      <Typography variant="body1" color="text.secondary" paragraph>
        Desculpe, encontramos um problema ao processar sua solicitação.
        Você pode tentar novamente ou voltar para a página inicial.
      </Typography>
      
      <Box sx={{ my: 2, display: 'flex', gap: 2 }}>
        <Button
          variant="contained"
          color="primary"
          startIcon={<RefreshIcon />}
          onClick={resetErrorBoundary}
        >
          Tentar Novamente
        </Button>
        
        <Button
          variant="outlined"
          component={Link}
          to="/"
          startIcon={<HomeIcon />}
        >
          Página Inicial
        </Button>
      </Box>
      
      <Box sx={{ width: '100%', mt: 3 }}>
        <Button
          variant="text"
          color="inherit"
          onClick={() => setShowDetails(!showDetails)}
          startIcon={<ExpandMoreIcon
            sx={{
              transform: showDetails ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 0.3s',
            }}
          />}
        >
          {showDetails ? "Ocultar detalhes" : "Mostrar detalhes"}
        </Button>
        
        <Collapse in={showDetails}>
          <Paper
            variant="outlined"
            sx={{
              p: 2,
              mt: 1,
              bgcolor: 'background.default',
              fontFamily: 'monospace',
              fontSize: '0.875rem',
              maxHeight: '200px',
              overflow: 'auto',
            }}
          >
            <Typography variant="subtitle2" gutterBottom>
              Erro: {error.message}
            </Typography>
            <Typography variant="body2" component="pre" sx={{ whiteSpace: 'pre-wrap' }}>
              {error.stack}
            </Typography>
          </Paper>
        </Collapse>
      </Box>
      
      {!feedbackSent ? (
        <Box sx={{ width: '100%', mt: 4 }}>
          <Typography variant="subtitle2" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
            <ReportProblemIcon sx={{ mr: 1, fontSize: '1rem' }} />
            Ajude-nos a melhorar
          </Typography>
          
          <TextField
            fullWidth
            multiline
            rows={3}
            placeholder="Descreva o que você estava fazendo quando o erro ocorreu..."
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            variant="outlined"
            size="small"
            sx={{ mb: 1 }}
          />
          
          <Button
            variant="outlined"
            color="primary"
            size="small"
            disabled={!feedback.trim()}
            onClick={handleSubmitFeedback}
          >
            Enviar Feedback
          </Button>
        </Box>
      ) : (
        <Box sx={{ mt: 2 }}>
          <Typography variant="body2" color="success.main">
            Obrigado pelo seu feedback. Isso nos ajudará a melhorar a aplicação.
          </Typography>
        </Box>
      )}
    </ErrorContainer>
  );
};

export default ErrorFallback; 