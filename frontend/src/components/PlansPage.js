import React, { useState, useEffect } from 'react';
import { getAvailablePlans, upgradePlan } from '../services/inner-ai-service';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  CardActions,
  Button,
  Grid,
  Chip,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Paper
} from '@mui/material';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import InfoIcon from '@mui/icons-material/Info';

const PlansPage = () => {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPlan, setCurrentPlan] = useState(null);
  const [confirmDialog, setConfirmDialog] = useState({ open: false, plan: null });
  const [upgradeStatus, setUpgradeStatus] = useState({ success: false, error: null });

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        setLoading(true);
        const data = await getAvailablePlans();
        setPlans(data.plans);
        setCurrentPlan(data.current_plan);
        setError(null);
      } catch (err) {
        console.error('Erro ao carregar planos:', err);
        setError('Não foi possível carregar os planos disponíveis. Tente novamente mais tarde.');
      } finally {
        setLoading(false);
      }
    };

    fetchPlans();
  }, []);

  const handleOpenConfirmDialog = (plan) => {
    setConfirmDialog({
      open: true,
      plan: plan
    });
  };

  const handleCloseConfirmDialog = () => {
    setConfirmDialog({
      open: false,
      plan: null
    });
  };

  const handleUpgradePlan = async () => {
    if (!confirmDialog.plan) return;
    
    try {
      setLoading(true);
      await upgradePlan(confirmDialog.plan.id);
      setUpgradeStatus({
        success: true,
        error: null
      });
      // Atualiza o plano atual
      setCurrentPlan(confirmDialog.plan);
      handleCloseConfirmDialog();
    } catch (err) {
      console.error('Erro ao fazer upgrade de plano:', err);
      setUpgradeStatus({
        success: false,
        error: 'Não foi possível fazer upgrade do plano. Verifique os dados de pagamento ou tente novamente mais tarde.'
      });
    } finally {
      setLoading(false);
    }
  };

  // Função para exibir o preço formatado
  const formatPrice = (price) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price);
  };

  if (loading && plans.length === 0) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ mb: 4, textAlign: 'center' }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Planos de Assinatura Inner AI
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 700, mx: 'auto' }}>
          Escolha o plano que melhor se adapta às suas necessidades de criação com inteligência artificial.
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 4 }}>
          {error}
        </Alert>
      )}

      {upgradeStatus.success && (
        <Alert severity="success" sx={{ mb: 4 }}>
          Seu plano foi atualizado com sucesso para {currentPlan?.name}!
        </Alert>
      )}

      {upgradeStatus.error && (
        <Alert severity="error" sx={{ mb: 4 }}>
          {upgradeStatus.error}
        </Alert>
      )}

      {currentPlan && (
        <Paper 
          elevation={2} 
          sx={{ 
            p: 3, 
            mb: 4, 
            backgroundColor: 'rgba(25, 118, 210, 0.05)',
            borderLeft: '4px solid #1976d2'
          }}
        >
          <Typography variant="h6" gutterBottom>
            Seu plano atual: <Chip label={currentPlan.name} color="primary" />
          </Typography>
          <Typography variant="body2">
            Válido até: {new Date(currentPlan.valid_until).toLocaleDateString()}
          </Typography>
        </Paper>
      )}

      <Grid container spacing={3}>
        {plans.map((plan) => (
          <Grid item xs={12} md={4} key={plan.id}>
            <Card 
              sx={{ 
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                position: 'relative',
                border: currentPlan?.id === plan.id ? '2px solid #1976d2' : 'none'
              }}
            >
              {currentPlan?.id === plan.id && (
                <Chip 
                  label="Plano Atual" 
                  color="primary" 
                  sx={{
                    position: 'absolute',
                    top: -12,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    zIndex: 1
                  }}
                />
              )}
              
              <CardContent sx={{ flexGrow: 1 }}>
                <Typography variant="h5" component="h2" gutterBottom align="center">
                  {plan.name}
                </Typography>
                
                <Box sx={{ my: 2, textAlign: 'center' }}>
                  <Typography variant="h4" component="div" color="primary">
                    {formatPrice(plan.price)}
                  </Typography>
                  <Typography variant="subtitle1" color="text.secondary">
                    por mês
                  </Typography>
                </Box>
                
                <Divider sx={{ my: 2 }} />
                
                <List dense>
                  <ListItem>
                    <ListItemIcon>
                      <CheckIcon color="success" />
                    </ListItemIcon>
                    <ListItemText primary={`${plan.tokens_per_month} tokens/mês`} />
                  </ListItem>
                  
                  <ListItem>
                    <ListItemIcon>
                      <CheckIcon color="success" />
                    </ListItemIcon>
                    <ListItemText primary={`${plan.messages_per_month} mensagens/mês`} />
                  </ListItem>
                  
                  <ListItem>
                    <ListItemIcon>
                      {plan.features.video ? <CheckIcon color="success" /> : <CloseIcon color="error" />}
                    </ListItemIcon>
                    <ListItemText 
                      primary="Geração de vídeos" 
                      secondary={plan.features.video ? `${plan.features.video_limit || 'Ilimitado'} por mês` : 'Não incluído'} 
                    />
                  </ListItem>
                  
                  <ListItem>
                    <ListItemIcon>
                      {plan.features.avatar ? <CheckIcon color="success" /> : <CloseIcon color="error" />}
                    </ListItemIcon>
                    <ListItemText 
                      primary="Criador de avatares" 
                      secondary={plan.features.avatar ? `${plan.features.avatar_limit || 'Ilimitado'} por mês` : 'Não incluído'} 
                    />
                  </ListItem>
                  
                  <ListItem>
                    <ListItemIcon>
                      {plan.features.fashion ? <CheckIcon color="success" /> : <CloseIcon color="error" />}
                    </ListItemIcon>
                    <ListItemText 
                      primary="Fotos fashion" 
                      secondary={plan.features.fashion ? `${plan.features.fashion_limit || 'Ilimitado'} por mês` : 'Não incluído'} 
                    />
                  </ListItem>
                </List>
              </CardContent>
              
              <CardActions sx={{ justifyContent: 'center', pb: 3 }}>
                {currentPlan?.id === plan.id ? (
                  <Button 
                    variant="outlined" 
                    color="primary" 
                    disabled 
                    startIcon={<InfoIcon />}
                  >
                    Plano Atual
                  </Button>
                ) : (
                  <Button 
                    variant="contained" 
                    color="primary" 
                    fullWidth 
                    onClick={() => handleOpenConfirmDialog(plan)}
                  >
                    {currentPlan && plan.price > currentPlan.price ? 'Fazer Upgrade' : 'Selecionar Plano'}
                  </Button>
                )}
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Diálogo de confirmação */}
      <Dialog
        open={confirmDialog.open}
        onClose={handleCloseConfirmDialog}
      >
        <DialogTitle>
          Confirmar alteração de plano
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            Você está prestes a fazer upgrade para o plano <strong>{confirmDialog.plan?.name}</strong> por {formatPrice(confirmDialog.plan?.price)} mensais.
            
            {currentPlan && (
              <>
                <br /><br />
                Seu plano atual ({currentPlan.name}) será substituído e a cobrança será feita imediatamente.
              </>
            )}
            <br /><br />
            Deseja confirmar esta operação?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseConfirmDialog} color="inherit">
            Cancelar
          </Button>
          <Button onClick={handleUpgradePlan} color="primary" variant="contained" autoFocus disabled={loading}>
            {loading ? <CircularProgress size={24} color="inherit" /> : 'Confirmar'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default PlansPage; 