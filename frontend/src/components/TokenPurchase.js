import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Button,
  Grid,
  Slider,
  TextField,
  CircularProgress,
  Alert,
  Paper,
  Tabs,
  Tab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  Divider
} from '@mui/material';
import TokenIcon from '@mui/icons-material/Token';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { 
  getTokenBalance,
  purchaseTokens,
  getPaymentHistory
} from '../services/payment-service';
import PaymentMethodSelector from './PaymentMethodSelector';

const TOKEN_PACKAGES = [
  { amount: 500, label: '500 tokens', discount: 0 },
  { amount: 1000, label: '1.000 tokens', discount: 0 },
  { amount: 5000, label: '5.000 tokens', discount: 0.1 },
  { amount: 10000, label: '10.000 tokens', discount: 0.15 },
  { amount: 25000, label: '25.000 tokens', discount: 0.2 },
  { amount: 50000, label: '50.000 tokens', discount: 0.25 }
];

// Preço base por token
const BASE_PRICE = 0.02;

const TokenPurchase = () => {
  const [tokenBalance, setTokenBalance] = useState(null);
  const [balanceLoading, setBalanceLoading] = useState(true);
  const [balanceError, setBalanceError] = useState(null);
  
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [customAmount, setCustomAmount] = useState('');
  const [activeTab, setActiveTab] = useState(0);
  
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(null);
  const [purchaseLoading, setPurchaseLoading] = useState(false);
  const [purchaseError, setPurchaseError] = useState(null);
  const [purchaseSuccess, setPurchaseSuccess] = useState(false);
  
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState(null);
  
  // Carrega o saldo ao montar o componente
  useEffect(() => {
    loadTokenBalance();
    loadPaymentHistory();
  }, []);
  
  const loadTokenBalance = async () => {
    setBalanceLoading(true);
    try {
      const response = await getTokenBalance();
      
      if (response.success) {
        setTokenBalance(response);
      } else {
        setBalanceError(response.error || 'Erro ao carregar saldo de tokens');
      }
    } catch (err) {
      setBalanceError('Ocorreu um erro ao carregar saldo de tokens');
      console.error(err);
    } finally {
      setBalanceLoading(false);
    }
  };
  
  const loadPaymentHistory = async () => {
    setHistoryLoading(true);
    try {
      const response = await getPaymentHistory();
      
      if (response.history) {
        setHistory(response.history);
      } else {
        setHistoryError(response.error || 'Erro ao carregar histórico');
      }
    } catch (err) {
      setHistoryError('Ocorreu um erro ao carregar histórico');
      console.error(err);
    } finally {
      setHistoryLoading(false);
    }
  };
  
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };
  
  const handleSelectPackage = (packageItem) => {
    setSelectedPackage(packageItem);
    setCustomAmount('');
    setPurchaseError(null);
  };
  
  const handleCustomAmountChange = (e) => {
    // Remove caracteres não numéricos
    const value = e.target.value.replace(/[^0-9]/g, '');
    setCustomAmount(value);
    setSelectedPackage(null);
    setPurchaseError(null);
  };
  
  const handlePurchaseClick = () => {
    const amount = selectedPackage 
      ? selectedPackage.amount 
      : parseInt(customAmount);
    
    // Validação
    if (!amount || amount <= 0) {
      setPurchaseError('Por favor, selecione um pacote ou informe uma quantidade válida');
      return;
    }
    
    if (amount < 100) {
      setPurchaseError('A quantidade mínima é de 100 tokens');
      return;
    }
    
    if (amount > 100000) {
      setPurchaseError('A quantidade máxima é de 100.000 tokens');
      return;
    }
    
    // Abre o diálogo de confirmação
    setDialogOpen(true);
    setPurchaseError(null);
    setPurchaseSuccess(false);
  };
  
  const handlePaymentMethodSelect = (methodId) => {
    setSelectedPaymentMethod(methodId);
    setPurchaseError(null);
  };
  
  const handleConfirmPurchase = async () => {
    if (!selectedPaymentMethod) {
      setPurchaseError('Por favor, selecione um método de pagamento');
      return;
    }
    
    const amount = selectedPackage 
      ? selectedPackage.amount 
      : parseInt(customAmount);
    
    setPurchaseLoading(true);
    setPurchaseError(null);
    
    try {
      const purchaseData = {
        amount: amount,
        payment_method_id: selectedPaymentMethod
      };
      
      const response = await purchaseTokens(purchaseData);
      
      if (response.success) {
        setPurchaseSuccess(true);
        // Recarrega o saldo após 2 segundos
        setTimeout(() => {
          loadTokenBalance();
          loadPaymentHistory();
          handleDialogClose();
        }, 2000);
      } else {
        setPurchaseError(response.error || 'Erro ao processar compra de tokens');
      }
    } catch (err) {
      setPurchaseError('Ocorreu um erro ao processar a compra');
      console.error(err);
    } finally {
      setPurchaseLoading(false);
    }
  };
  
  const handleDialogClose = () => {
    if (!purchaseLoading) {
      setDialogOpen(false);
      setPurchaseSuccess(false);
    }
  };
  
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', { 
      style: 'currency', 
      currency: 'BRL' 
    }).format(value);
  };
  
  const calculatePrice = (amount) => {
    if (!amount) return 0;
    
    // Encontra o desconto aplicável com base na quantidade
    let discount = 0;
    if (amount >= 50000) discount = 0.25;
    else if (amount >= 25000) discount = 0.20;
    else if (amount >= 10000) discount = 0.15;
    else if (amount >= 5000) discount = 0.10;
    else if (amount >= 2000) discount = 0.05;
    
    return amount * BASE_PRICE * (1 - discount);
  };
  
  const getSelectedAmount = () => {
    if (selectedPackage) return selectedPackage.amount;
    if (customAmount) return parseInt(customAmount);
    return 0;
  };
  
  return (
    <Container maxWidth="lg">
      <Typography variant="h4" gutterBottom component="h1" sx={{ mt: 4, mb: 2 }}>
        Tokens
      </Typography>
      
      {balanceLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
          <CircularProgress />
        </Box>
      ) : balanceError ? (
        <Alert severity="error" sx={{ mb: 4 }}>
          {balanceError}
        </Alert>
      ) : (
        <Paper elevation={2} sx={{ p: 3, mb: 4 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={6}>
              <Typography variant="h6" gutterBottom>
                Seu saldo atual
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <TokenIcon sx={{ mr: 1, color: 'primary.main' }} />
                <Typography variant="h4" color="primary.main">
                  {tokenBalance ? tokenBalance.balance.toLocaleString() : 0}
                </Typography>
              </Box>
              {tokenBalance && (
                <Typography variant="body2" color="text.secondary">
                  Plano: {tokenBalance.plan_name || 'Gratuito'}
                </Typography>
              )}
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography variant="body2" paragraph>
                Os tokens são usados para gerar conteúdo com IA.
                Diferentes funcionalidades consomem quantidades variadas de tokens.
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {tokenBalance && (
                  <>Uso: {tokenBalance.tokens_used} de {tokenBalance.tokens_total} tokens</>
                )}
              </Typography>
            </Grid>
          </Grid>
        </Paper>
      )}
      
      <Box sx={{ mb: 4 }}>
        <Tabs value={activeTab} onChange={handleTabChange} centered>
          <Tab label="Comprar Tokens" />
          <Tab label="Histórico de Compras" />
        </Tabs>
      </Box>
      
      {activeTab === 0 && (
        <>
          <Typography variant="h6" gutterBottom>
            Pacotes de Tokens
          </Typography>
          
          <Grid container spacing={2} sx={{ mb: 4 }}>
            {TOKEN_PACKAGES.map((pkg) => (
              <Grid item xs={6} sm={4} md={2} key={pkg.amount}>
                <Card 
                  sx={{ 
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    cursor: 'pointer',
                    border: selectedPackage?.amount === pkg.amount 
                      ? '2px solid #2196f3' 
                      : '1px solid #e0e0e0'
                  }}
                  onClick={() => handleSelectPackage(pkg)}
                >
                  <CardContent sx={{ flexGrow: 1, p: 2, textAlign: 'center' }}>
                    <TokenIcon color="primary" sx={{ fontSize: 40, mb: 1 }} />
                    <Typography variant="h6" component="div" gutterBottom>
                      {pkg.amount.toLocaleString()}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {formatCurrency(calculatePrice(pkg.amount))}
                    </Typography>
                    {pkg.discount > 0 && (
                      <Typography variant="caption" sx={{ color: 'success.main' }}>
                        {pkg.discount * 100}% de desconto
                      </Typography>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
          
          <Box sx={{ mb: 4 }}>
            <Typography variant="h6" gutterBottom>
              Quantidade Personalizada
            </Typography>
            
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} sm={8} md={6}>
                <TextField
                  label="Quantidade de tokens"
                  type="text"
                  value={customAmount}
                  onChange={handleCustomAmountChange}
                  fullWidth
                  placeholder="Mínimo 100 tokens"
                  InputProps={{
                    startAdornment: <TokenIcon sx={{ mr: 1, color: 'action.active' }} />,
                  }}
                />
              </Grid>
              
              <Grid item xs={12} sm={4} md={6}>
                <Typography variant="body1">
                  Valor: {formatCurrency(calculatePrice(parseInt(customAmount) || 0))}
                </Typography>
                {parseInt(customAmount) >= 2000 && (
                  <Typography variant="caption" sx={{ color: 'success.main' }}>
                    Inclui desconto por volume
                  </Typography>
                )}
              </Grid>
            </Grid>
          </Box>
          
          {purchaseError && (
            <Alert severity="error" sx={{ mt: 2, mb: 2 }}>
              {purchaseError}
            </Alert>
          )}
          
          <Box sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
            <Button
              variant="contained"
              color="primary"
              size="large"
              onClick={handlePurchaseClick}
              disabled={!selectedPackage && !customAmount}
              startIcon={<TokenIcon />}
            >
              Comprar {getSelectedAmount().toLocaleString()} tokens
            </Button>
          </Box>
        </>
      )}
      
      {activeTab === 1 && (
        <>
          <Typography variant="h6" gutterBottom>
            Histórico de Transações
          </Typography>
          
          {historyLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
              <CircularProgress />
            </Box>
          ) : historyError ? (
            <Alert severity="error" sx={{ mb: 4 }}>
              {historyError}
            </Alert>
          ) : history.length === 0 ? (
            <Paper elevation={1} sx={{ p: 3, textAlign: 'center' }}>
              <Typography variant="body1" color="text.secondary">
                Nenhuma transação encontrada.
              </Typography>
            </Paper>
          ) : (
            <List sx={{ bgcolor: 'background.paper' }}>
              {history.map((transaction, index) => (
                <React.Fragment key={transaction.id}>
                  <ListItem alignItems="flex-start">
                    <ListItemText
                      primary={
                        <Typography variant="subtitle1">
                          {transaction.description}
                        </Typography>
                      }
                      secondary={
                        <>
                          <Typography variant="body2" component="span" color="text.primary">
                            {formatCurrency(transaction.amount)}
                          </Typography>
                          {' — '}
                          <Typography variant="caption" color="text.secondary">
                            {new Date(transaction.created_at).toLocaleString()}
                          </Typography>
                          <br />
                          <Typography variant="caption" color="text.secondary">
                            Status: {transaction.status}
                          </Typography>
                        </>
                      }
                    />
                  </ListItem>
                  {index < history.length - 1 && <Divider component="li" />}
                </React.Fragment>
              ))}
            </List>
          )}
        </>
      )}
      
      {/* Diálogo de confirmação */}
      <Dialog 
        open={dialogOpen} 
        onClose={!purchaseLoading ? handleDialogClose : undefined}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Confirmar Compra
        </DialogTitle>
        
        <DialogContent>
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              {getSelectedAmount().toLocaleString()} tokens
            </Typography>
            
            <Typography variant="body1" paragraph>
              Valor total: {formatCurrency(calculatePrice(getSelectedAmount()))}
            </Typography>
            
            <Divider sx={{ my: 2 }} />
            
            <Typography variant="subtitle1" gutterBottom>
              Selecione o método de pagamento:
            </Typography>
            
            <PaymentMethodSelector 
              onSelect={handlePaymentMethodSelect}
              selectedMethodId={selectedPaymentMethod}
            />
          </Box>
          
          {purchaseError && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {purchaseError}
            </Alert>
          )}
          
          {purchaseSuccess && (
            <Alert 
              severity="success" 
              sx={{ mt: 2 }}
              icon={<CheckCircleIcon fontSize="inherit" />}
            >
              Compra realizada com sucesso! Os tokens foram adicionados à sua conta.
            </Alert>
          )}
        </DialogContent>
        
        <DialogActions>
          <Button 
            onClick={handleDialogClose} 
            disabled={purchaseLoading}
          >
            Cancelar
          </Button>
          
          <Button 
            onClick={handleConfirmPurchase}
            variant="contained" 
            color="primary"
            disabled={purchaseLoading || purchaseSuccess}
            startIcon={purchaseLoading ? <CircularProgress size={24} /> : null}
          >
            {purchaseLoading ? 'Processando...' : 'Confirmar Compra'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default TokenPurchase; 