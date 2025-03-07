import React, { useState } from 'react';
import { addTokens } from '../services/inner-ai-service';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  CardActions,
  Button,
  Grid,
  TextField,
  Slider,
  InputAdornment,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Paper
} from '@mui/material';
import ChipIcon from '@mui/icons-material/Memory';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';

const TOKEN_PACKS = [
  { amount: 1000, price: 19.90, discount: 0 },
  { amount: 5000, price: 89.90, discount: 10 },
  { amount: 10000, price: 169.90, discount: 15 },
  { amount: 25000, price: 399.90, discount: 20 },
  { amount: 50000, price: 749.90, discount: 25 }
];

const TokensPage = () => {
  const [selectedAmount, setSelectedAmount] = useState(5000);
  const [customAmount, setCustomAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState({ open: false });
  const [purchaseStatus, setPurchaseStatus] = useState({ success: false, error: null });

  // Encontra o pacote de token correspondente ao valor selecionado
  const getTokenPack = (amount) => {
    return TOKEN_PACKS.find(pack => pack.amount === amount) || {
      amount,
      price: calculateCustomPrice(amount),
      discount: getDiscountForAmount(amount)
    };
  };

  // Calcula preço para valores personalizados
  const calculateCustomPrice = (amount) => {
    // Base price: 0.02 per token
    const basePrice = amount * 0.02;
    const discount = getDiscountForAmount(amount);
    return basePrice * (1 - discount / 100);
  };

  // Determina o desconto com base na quantidade
  const getDiscountForAmount = (amount) => {
    if (amount >= 50000) return 25;
    if (amount >= 25000) return 20;
    if (amount >= 10000) return 15;
    if (amount >= 5000) return 10;
    if (amount >= 2000) return 5;
    return 0;
  };

  // Formata o preço
  const formatPrice = (price) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price);
  };

  const handleSelectAmount = (amount) => {
    setSelectedAmount(amount);
    setCustomAmount('');
  };

  const handleCustomAmountChange = (event) => {
    const value = event.target.value;
    if (value === '' || /^\d+$/.test(value)) {
      setCustomAmount(value);
      if (value !== '') {
        setSelectedAmount(parseInt(value, 10));
      }
    }
  };

  const handleSliderChange = (event, newValue) => {
    setSelectedAmount(newValue);
    setCustomAmount(newValue.toString());
  };

  const handleOpenConfirmDialog = () => {
    setConfirmDialog({ open: true });
  };

  const handleCloseConfirmDialog = () => {
    setConfirmDialog({ open: false });
  };

  const handlePurchaseTokens = async () => {
    if (selectedAmount <= 0) return;
    
    try {
      setLoading(true);
      await addTokens(selectedAmount);
      setPurchaseStatus({
        success: true,
        error: null
      });
      handleCloseConfirmDialog();
    } catch (err) {
      console.error('Erro ao comprar tokens:', err);
      setPurchaseStatus({
        success: false,
        error: 'Não foi possível completar a compra de tokens. Verifique os dados de pagamento ou tente novamente mais tarde.'
      });
    } finally {
      setLoading(false);
    }
  };

  const selectedPack = getTokenPack(selectedAmount);

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Box sx={{ mb: 4, textAlign: 'center' }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Adicionar Tokens à sua Conta
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 700, mx: 'auto' }}>
          Os tokens são usados para criar conteúdo com IA, como vídeos, avatares e fotos fashion.
        </Typography>
      </Box>

      {purchaseStatus.success && (
        <Alert severity="success" sx={{ mb: 4 }}>
          {selectedAmount} tokens foram adicionados à sua conta com sucesso!
        </Alert>
      )}

      {purchaseStatus.error && (
        <Alert severity="error" sx={{ mb: 4 }}>
          {purchaseStatus.error}
        </Alert>
      )}

      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Paper sx={{ p: 3, mb: 4 }}>
            <Typography variant="h6" gutterBottom>
              Selecione um Pacote de Tokens
            </Typography>
            
            <Grid container spacing={2} sx={{ mb: 4 }}>
              {TOKEN_PACKS.map((pack) => (
                <Grid item xs={6} sm={4} md={2.4} key={pack.amount}>
                  <Card 
                    sx={{ 
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      cursor: 'pointer',
                      border: selectedAmount === pack.amount ? '2px solid #1976d2' : '1px solid #e0e0e0',
                      backgroundColor: selectedAmount === pack.amount ? 'rgba(25, 118, 210, 0.05)' : 'white'
                    }}
                    onClick={() => handleSelectAmount(pack.amount)}
                  >
                    <CardContent sx={{ p: 2, textAlign: 'center' }}>
                      <ChipIcon color="primary" sx={{ fontSize: 32, mb: 1 }} />
                      <Typography variant="h6" component="div">
                        {pack.amount.toLocaleString()}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        tokens
                      </Typography>
                      
                      <Box sx={{ mt: 1 }}>
                        <Typography variant="h6" color="primary">
                          {formatPrice(pack.price)}
                        </Typography>
                        
                        {pack.discount > 0 && (
                          <Box sx={{ mt: 0.5 }}>
                            <Typography 
                              variant="caption" 
                              sx={{ 
                                backgroundColor: 'success.light', 
                                color: 'white', 
                                px: 1, 
                                py: 0.3, 
                                borderRadius: 1 
                              }}
                            >
                              -{pack.discount}% OFF
                            </Typography>
                          </Box>
                        )}
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
            
            <Typography variant="h6" gutterBottom>
              Ou Personalize a Quantidade
            </Typography>
            
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Quantidade de Tokens"
                  value={customAmount}
                  onChange={handleCustomAmountChange}
                  type="text"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <ChipIcon color="primary" />
                      </InputAdornment>
                    ),
                  }}
                  helperText="Mínimo de 500 tokens"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <Slider
                  value={selectedAmount}
                  onChange={handleSliderChange}
                  min={500}
                  max={100000}
                  step={500}
                  marks={[
                    { value: 500, label: '500' },
                    { value: 25000, label: '25K' },
                    { value: 50000, label: '50K' },
                    { value: 100000, label: '100K' }
                  ]}
                  valueLabelDisplay="auto"
                />
              </Grid>
            </Grid>
          </Paper>
        </Grid>
        
        <Grid item xs={12}>
          <Paper 
            elevation={3} 
            sx={{ 
              p: 3, 
              borderTop: '4px solid #1976d2'
            }}
          >
            <Typography variant="h5" gutterBottom>
              Resumo da Compra
            </Typography>
            
            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid item xs={12} sm={6}>
                <Typography variant="body1">
                  Quantidade de Tokens:
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body1" fontWeight="bold">
                  {selectedAmount.toLocaleString()}
                </Typography>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <Typography variant="body1">
                  Preço Base:
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body1">
                  {formatPrice(selectedAmount * 0.02)}
                </Typography>
              </Grid>
              
              {selectedPack.discount > 0 && (
                <>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body1" color="success.main" sx={{ display: 'flex', alignItems: 'center' }}>
                      <LocalOfferIcon sx={{ mr: 1, fontSize: 18 }} />
                      Desconto ({selectedPack.discount}%):
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body1" color="success.main">
                      -{formatPrice((selectedAmount * 0.02) * (selectedPack.discount / 100))}
                    </Typography>
                  </Grid>
                </>
              )}
              
              <Grid item xs={12}>
                <Box sx={{ borderTop: '1px solid #e0e0e0', pt: 2, mt: 1 }}>
                  <Grid container>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="h6">
                        Total:
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="h6" color="primary">
                        {formatPrice(selectedPack.price)}
                      </Typography>
                    </Grid>
                  </Grid>
                </Box>
              </Grid>
            </Grid>
            
            <Button 
              variant="contained" 
              color="primary" 
              size="large" 
              fullWidth
              startIcon={<ShoppingCartIcon />}
              onClick={handleOpenConfirmDialog}
              disabled={selectedAmount < 500 || loading}
            >
              {loading ? <CircularProgress size={24} color="inherit" /> : 'Comprar Tokens'}
            </Button>
          </Paper>
        </Grid>
      </Grid>

      {/* Diálogo de confirmação */}
      <Dialog
        open={confirmDialog.open}
        onClose={handleCloseConfirmDialog}
      >
        <DialogTitle>
          Confirmar Compra de Tokens
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            Você está prestes a adicionar <strong>{selectedAmount.toLocaleString()} tokens</strong> à sua conta por <strong>{formatPrice(selectedPack.price)}</strong>. A cobrança será feita imediatamente no cartão cadastrado.
            <br /><br />
            Deseja confirmar esta compra?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseConfirmDialog} color="inherit">
            Cancelar
          </Button>
          <Button onClick={handlePurchaseTokens} color="primary" variant="contained" autoFocus disabled={loading}>
            {loading ? <CircularProgress size={24} color="inherit" /> : 'Confirmar Compra'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default TokensPage; 