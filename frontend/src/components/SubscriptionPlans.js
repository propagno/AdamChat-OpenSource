import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Container, 
  Typography, 
  Box, 
  Card, 
  CardContent, 
  CardActions,
  Button, 
  Grid, 
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Alert,
  Paper
} from '@mui/material';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import StarIcon from '@mui/icons-material/Star';
import TokenIcon from '@mui/icons-material/Token';
import PaymentMethodSelector from './PaymentMethodSelector';
import { 
  getSubscriptionPlans,
  upgradePlan
} from '../services/payment-service';

const SubscriptionPlans = () => {
  const [plans, setPlans] = useState([]);
  const [currentPlan, setCurrentPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(null);
  const [upgradeLoading, setUpgradeLoading] = useState(false);
  const [upgradeError, setUpgradeError] = useState(null);
  const [upgradeSuccess, setUpgradeSuccess] = useState(false);
  
  const navigate = useNavigate();
  
  // Carrega os planos ao montar o componente
  useEffect(() => {
    loadPlans();
  }, []);
  
  const loadPlans = async () => {
    setLoading(true);
    try {
      const response = await getSubscriptionPlans();
      
      if (response.plans) {
        setPlans(response.plans);
        setCurrentPlan(response.current_plan);
      } else {
        setError('Não foi possível carregar os planos.');
      }
    } catch (err) {
      setError('Ocorreu um erro ao carregar os planos.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };
  
  const handleSelectPlan = (plan) => {
    // Verifica se já é o plano atual
    if (currentPlan && plan.id === currentPlan.plan_id) {
      return;
    }
    
    setSelectedPlan(plan);
    setSelectedPaymentMethod(null);
    setUpgradeError(null);
    setUpgradeSuccess(false);
    setDialogOpen(true);
  };
  
  const handleDialogClose = () => {
    setDialogOpen(false);
    setSelectedPlan(null);
    setSelectedPaymentMethod(null);
    setUpgradeError(null);
    setUpgradeSuccess(false);
  };
  
  const handleUpgrade = async () => {
    // Verifica se plano é gratuito ou se selecionou método de pagamento
    if (selectedPlan.price > 0 && !selectedPaymentMethod) {
      setUpgradeError('Por favor, selecione um método de pagamento.');
      return;
    }
    
    setUpgradeLoading(true);
    setUpgradeError(null);
    
    try {
      const upgradeData = {
        plan_id: selectedPlan.id
      };
      
      // Adiciona método de pagamento se não for plano gratuito
      if (selectedPlan.price > 0) {
        upgradeData.payment_method_id = selectedPaymentMethod;
      }
      
      const response = await upgradePlan(upgradeData);
      
      if (response.success) {
        setUpgradeSuccess(true);
        // Recarrega os planos após 2 segundos
        setTimeout(() => {
          loadPlans();
          handleDialogClose();
        }, 2000);
      } else {
        setUpgradeError(response.error || 'Erro ao fazer upgrade do plano.');
      }
    } catch (err) {
      setUpgradeError('Ocorreu um erro ao processar o upgrade.');
      console.error(err);
    } finally {
      setUpgradeLoading(false);
    }
  };
  
  const handlePaymentMethodSelect = (methodId) => {
    setSelectedPaymentMethod(methodId);
    setUpgradeError(null);
  };
  
  const formatPrice = (price) => {
    return price > 0 
      ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(price)
      : 'Grátis';
  };
  
  if (loading) {
    return (
      <Container maxWidth="lg">
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }
  
  if (error) {
    return (
      <Container maxWidth="lg">
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      </Container>
    );
  }
  
  return (
    <Container maxWidth="lg">
      <Typography variant="h4" gutterBottom component="h1" sx={{ mt: 4, mb: 2 }}>
        Planos de Assinatura
      </Typography>
      
      {currentPlan && (
        <Paper elevation={2} sx={{ p: 3, mb: 4 }}>
          <Typography variant="h6" gutterBottom>
            Seu plano atual
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, alignItems: { sm: 'center' }, justifyContent: 'space-between' }}>
            <Box>
              <Typography variant="h5" color="primary">
                {currentPlan.plan_name}
              </Typography>
              <Typography variant="body1">
                <strong>Tokens disponíveis:</strong> {currentPlan.tokens_available}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Validade: {new Date(currentPlan.end_date).toLocaleDateString()}
              </Typography>
            </Box>
            <Button
              variant="outlined"
              color="primary"
              sx={{ mt: { xs: 2, sm: 0 } }}
              onClick={() => navigate('/dashboard/tokens')}
            >
              <TokenIcon sx={{ mr: 1 }} />
              Comprar tokens
            </Button>
          </Box>
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
                border: plan.is_current ? '2px solid #2196f3' : 'none',
              }}
              elevation={plan.is_current ? 4 : 1}
            >
              {plan.is_current && (
                <Chip 
                  label="Plano Atual" 
                  color="primary" 
                  sx={{ 
                    position: 'absolute', 
                    top: 10, 
                    right: 10 
                  }} 
                />
              )}
              
              <CardContent sx={{ flex: '1 0 auto' }}>
                <Typography variant="h5" component="div" gutterBottom>
                  {plan.name}
                  {plan.level === 'premium' && <StarIcon color="warning" sx={{ ml: 1 }} />}
                </Typography>
                
                <Typography variant="h4" color="primary" gutterBottom>
                  {formatPrice(plan.price)}
                  <Typography variant="body2" component="span" color="text.secondary">
                    /mês
                  </Typography>
                </Typography>
                
                <Typography variant="body2" color="text.secondary" paragraph>
                  {plan.description}
                </Typography>
                
                <Divider sx={{ my: 2 }} />
                
                <List dense sx={{ py: 0 }}>
                  <ListItem sx={{ px: 0 }}>
                    <ListItemIcon sx={{ minWidth: 36 }}>
                      <CheckIcon color="success" />
                    </ListItemIcon>
                    <ListItemText 
                      primary={`${plan.tokens_per_month.toLocaleString()} tokens por mês`} 
                    />
                  </ListItem>
                  
                  <ListItem sx={{ px: 0 }}>
                    <ListItemIcon sx={{ minWidth: 36 }}>
                      <CheckIcon color="success" />
                    </ListItemIcon>
                    <ListItemText 
                      primary={`${plan.messages_per_month.toLocaleString()} mensagens por mês`} 
                    />
                  </ListItem>
                  
                  <ListItem sx={{ px: 0 }}>
                    <ListItemIcon sx={{ minWidth: 36 }}>
                      {plan.has_video_generation ? (
                        <CheckIcon color="success" />
                      ) : (
                        <CloseIcon color="error" />
                      )}
                    </ListItemIcon>
                    <ListItemText 
                      primary="Geração de vídeos" 
                      secondary={plan.has_video_generation && `Máx. ${plan.max_video_duration/60}min`}
                    />
                  </ListItem>
                  
                  <ListItem sx={{ px: 0 }}>
                    <ListItemIcon sx={{ minWidth: 36 }}>
                      {plan.has_avatar_creation ? (
                        <CheckIcon color="success" />
                      ) : (
                        <CloseIcon color="error" />
                      )}
                    </ListItemIcon>
                    <ListItemText primary="Criação de avatares" />
                  </ListItem>
                  
                  <ListItem sx={{ px: 0 }}>
                    <ListItemIcon sx={{ minWidth: 36 }}>
                      {plan.has_fashion_photo ? (
                        <CheckIcon color="success" />
                      ) : (
                        <CloseIcon color="error" />
                      )}
                    </ListItemIcon>
                    <ListItemText primary="Fotos de moda" />
                  </ListItem>
                  
                  <ListItem sx={{ px: 0 }}>
                    <ListItemIcon sx={{ minWidth: 36 }}>
                      {plan.has_priority_processing ? (
                        <CheckIcon color="success" />
                      ) : (
                        <CloseIcon color="error" />
                      )}
                    </ListItemIcon>
                    <ListItemText primary="Processamento prioritário" />
                  </ListItem>
                </List>
              </CardContent>
              
              <CardActions sx={{ p: 2, pt: 0 }}>
                <Button 
                  variant={plan.is_current ? "outlined" : "contained"}
                  color="primary"
                  fullWidth
                  disabled={plan.is_current}
                  onClick={() => handleSelectPlan(plan)}
                >
                  {plan.is_current ? 'Plano Atual' : 'Escolher Plano'}
                </Button>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>
      
      {/* Diálogo de confirmação */}
      <Dialog 
        open={dialogOpen} 
        onClose={!upgradeLoading ? handleDialogClose : undefined}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Upgrade de Plano
        </DialogTitle>
        
        <DialogContent>
          {selectedPlan && (
            <>
              <Typography variant="h6" gutterBottom>
                Confirmar mudança para o plano {selectedPlan.name}
              </Typography>
              
              <Typography variant="body1" paragraph>
                Preço: {formatPrice(selectedPlan.price)}/mês
              </Typography>
              
              {selectedPlan.price > 0 && (
                <Box sx={{ mt: 3 }}>
                  <Typography variant="subtitle1" gutterBottom>
                    Selecione o método de pagamento:
                  </Typography>
                  
                  <PaymentMethodSelector 
                    onSelect={handlePaymentMethodSelect}
                    selectedMethodId={selectedPaymentMethod}
                  />
                </Box>
              )}
              
              {upgradeError && (
                <Alert severity="error" sx={{ mt: 2 }}>
                  {upgradeError}
                </Alert>
              )}
              
              {upgradeSuccess && (
                <Alert severity="success" sx={{ mt: 2 }}>
                  Plano atualizado com sucesso!
                </Alert>
              )}
            </>
          )}
        </DialogContent>
        
        <DialogActions>
          <Button 
            onClick={handleDialogClose} 
            disabled={upgradeLoading}
          >
            Cancelar
          </Button>
          
          <Button 
            onClick={handleUpgrade}
            variant="contained" 
            color="primary"
            disabled={upgradeLoading || upgradeSuccess}
            startIcon={upgradeLoading ? <CircularProgress size={24} /> : null}
          >
            {upgradeLoading ? 'Processando...' : 'Confirmar Upgrade'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default SubscriptionPlans; 