import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  RadioGroup,
  FormControlLabel,
  Radio,
  Paper,
  Button,
  CircularProgress,
  Alert,
  Divider,
  Grid,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import CreditCardIcon from '@mui/icons-material/CreditCard';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import { 
  getPaymentMethods,
  addPaymentMethod,
  deletePaymentMethod
} from '../services/payment-service';

const PaymentMethodSelector = ({ onSelect, selectedMethodId }) => {
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newCardData, setNewCardData] = useState({
    number: '',
    name: '',
    expiry: '',
    cvc: ''
  });
  const [newCardErrors, setNewCardErrors] = useState({});
  const [addingCard, setAddingCard] = useState(false);
  const [addCardError, setAddCardError] = useState(null);
  const [deletingMethodId, setDeletingMethodId] = useState(null);
  
  useEffect(() => {
    loadPaymentMethods();
  }, []);
  
  const loadPaymentMethods = async () => {
    setLoading(true);
    try {
      const response = await getPaymentMethods();
      
      if (response.payment_methods) {
        setPaymentMethods(response.payment_methods);
        
        // Auto-seleciona o método padrão ou o primeiro disponível
        if (!selectedMethodId && response.payment_methods.length > 0) {
          const defaultMethod = response.payment_methods.find(m => m.is_default);
          if (defaultMethod) {
            onSelect(defaultMethod.id);
          } else {
            onSelect(response.payment_methods[0].id);
          }
        }
      } else {
        setError('Não foi possível carregar métodos de pagamento');
      }
    } catch (err) {
      setError('Erro ao carregar métodos de pagamento');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };
  
  const handleRadioChange = (event) => {
    onSelect(event.target.value);
  };
  
  const handleAddCardClick = () => {
    setDialogOpen(true);
    setNewCardData({
      number: '',
      name: '',
      expiry: '',
      cvc: ''
    });
    setNewCardErrors({});
    setAddCardError(null);
  };
  
  const handleDialogClose = () => {
    setDialogOpen(false);
  };
  
  const handleCardInputChange = (e) => {
    const { name, value } = e.target;
    setNewCardData({
      ...newCardData,
      [name]: value
    });
    
    // Limpa erro específico ao editar o campo
    if (newCardErrors[name]) {
      setNewCardErrors({
        ...newCardErrors,
        [name]: null
      });
    }
  };
  
  const validateCardForm = () => {
    const errors = {};
    
    if (!newCardData.number.trim()) {
      errors.number = 'Número do cartão é obrigatório';
    } else if (!/^\d{16}$/.test(newCardData.number.replace(/\s/g, ''))) {
      errors.number = 'Número do cartão inválido';
    }
    
    if (!newCardData.name.trim()) {
      errors.name = 'Nome do titular é obrigatório';
    }
    
    if (!newCardData.expiry.trim()) {
      errors.expiry = 'Data de validade é obrigatória';
    } else if (!/^\d{2}\/\d{2}$/.test(newCardData.expiry)) {
      errors.expiry = 'Formato inválido (MM/AA)';
    }
    
    if (!newCardData.cvc.trim()) {
      errors.cvc = 'Código de segurança é obrigatório';
    } else if (!/^\d{3,4}$/.test(newCardData.cvc)) {
      errors.cvc = 'CVC inválido';
    }
    
    setNewCardErrors(errors);
    return Object.keys(errors).length === 0;
  };
  
  const handleAddCard = async () => {
    if (!validateCardForm()) {
      return;
    }
    
    setAddingCard(true);
    setAddCardError(null);
    
    try {
      // Formato simulado para API sem integração real com o Stripe
      const cardData = {
        type: 'card',
        provider: 'local',
        set_default: paymentMethods.length === 0,
        details: {
          last4: newCardData.number.slice(-4),
          brand: getCardBrand(newCardData.number),
          exp_month: newCardData.expiry.split('/')[0],
          exp_year: `20${newCardData.expiry.split('/')[1]}`,
          name: newCardData.name
        }
      };
      
      const response = await addPaymentMethod(cardData);
      
      if (response.success) {
        // Recarrega os métodos
        await loadPaymentMethods();
        handleDialogClose();
        
        // Seleciona o novo método
        if (response.payment_method && response.payment_method.id) {
          onSelect(response.payment_method.id);
        }
      } else {
        setAddCardError(response.error || 'Erro ao adicionar cartão');
      }
    } catch (err) {
      setAddCardError('Ocorreu um erro ao adicionar o cartão');
      console.error(err);
    } finally {
      setAddingCard(false);
    }
  };
  
  const getCardBrand = (number) => {
    // Lógica simplificada para determinar a bandeira
    const firstDigit = number.charAt(0);
    
    if (firstDigit === '4') return 'visa';
    if (firstDigit === '5') return 'mastercard';
    if (firstDigit === '3') return 'amex';
    if (firstDigit === '6') return 'discover';
    
    return 'unknown';
  };
  
  const handleDeleteMethod = async (methodId) => {
    setDeletingMethodId(methodId);
    
    try {
      const response = await deletePaymentMethod(methodId);
      
      if (response.success) {
        // Recarrega a lista
        await loadPaymentMethods();
        
        // Se o método excluído era o selecionado, atualiza a seleção
        if (selectedMethodId === methodId) {
          if (paymentMethods.length > 1) {
            // Encontra outro método para selecionar
            const otherMethod = paymentMethods.find(m => m.id !== methodId);
            if (otherMethod) {
              onSelect(otherMethod.id);
            } else {
              onSelect(null);
            }
          } else {
            onSelect(null);
          }
        }
      } else {
        setError(response.error || 'Erro ao remover método de pagamento');
      }
    } catch (err) {
      setError('Ocorreu um erro ao remover o método de pagamento');
      console.error(err);
    } finally {
      setDeletingMethodId(null);
    }
  };
  
  const formatCardNumber = (number) => {
    return `•••• •••• •••• ${number}`;
  };
  
  const getCardIcon = (brand) => {
    // Em uma implementação real, você usaria ícones diferentes para cada bandeira
    return <CreditCardIcon />;
  };
  
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
        <CircularProgress size={28} />
      </Box>
    );
  }
  
  return (
    <>
      <Box sx={{ mt: 1 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        
        {paymentMethods.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 2 }}>
            <Typography variant="body1" color="text.secondary" gutterBottom>
              Nenhum método de pagamento cadastrado
            </Typography>
            <Button
              variant="contained"
              color="primary"
              startIcon={<AddIcon />}
              onClick={handleAddCardClick}
              sx={{ mt: 1 }}
            >
              Adicionar Cartão
            </Button>
          </Box>
        ) : (
          <>
            <RadioGroup
              value={selectedMethodId}
              onChange={handleRadioChange}
            >
              {paymentMethods.map((method) => (
                <Paper 
                  key={method.id} 
                  variant="outlined" 
                  sx={{ 
                    mb: 1, 
                    p: 1,
                    border: method.id === selectedMethodId ? '2px solid #2196f3' : '1px solid #e0e0e0'
                  }}
                >
                  <FormControlLabel
                    value={method.id}
                    control={<Radio />}
                    label={
                      <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                        <Box sx={{ mr: 1 }}>
                          {method.type === 'card' && getCardIcon(method.card?.brand || 'unknown')}
                        </Box>
                        
                        <Box sx={{ flexGrow: 1 }}>
                          {method.type === 'card' && (
                            <>
                              <Typography variant="body1">
                                {method.card?.brand || 'Cartão'} {formatCardNumber(method.card?.last4 || 'xxxx')}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                Expira em {method.card?.exp_month || 'xx'}/{method.card?.exp_year || 'xxxx'}
                                {method.is_default && ' • Padrão'}
                              </Typography>
                            </>
                          )}
                        </Box>
                        
                        <Button
                          size="small"
                          color="error"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleDeleteMethod(method.id);
                          }}
                          disabled={deletingMethodId === method.id}
                          sx={{ minWidth: 'auto' }}
                        >
                          {deletingMethodId === method.id ? (
                            <CircularProgress size={20} />
                          ) : (
                            <DeleteIcon fontSize="small" />
                          )}
                        </Button>
                      </Box>
                    }
                    sx={{ width: '100%', margin: 0 }}
                  />
                </Paper>
              ))}
            </RadioGroup>
            
            <Box sx={{ mt: 2 }}>
              <Button
                variant="outlined"
                startIcon={<AddIcon />}
                onClick={handleAddCardClick}
                fullWidth
              >
                Adicionar Novo Cartão
              </Button>
            </Box>
          </>
        )}
      </Box>
      
      {/* Diálogo para adicionar novo cartão */}
      <Dialog 
        open={dialogOpen} 
        onClose={!addingCard ? handleDialogClose : undefined}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Adicionar Cartão de Crédito
        </DialogTitle>
        
        <DialogContent>
          <Typography variant="body2" color="text.secondary" paragraph sx={{ mt: 1 }}>
            Por favor, preencha as informações do seu cartão de crédito.
          </Typography>
          
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                label="Número do Cartão"
                name="number"
                value={newCardData.number}
                onChange={handleCardInputChange}
                fullWidth
                placeholder="1234 5678 9012 3456"
                error={!!newCardErrors.number}
                helperText={newCardErrors.number}
                disabled={addingCard}
                inputProps={{ maxLength: 19 }}
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                label="Nome do Titular"
                name="name"
                value={newCardData.name}
                onChange={handleCardInputChange}
                fullWidth
                placeholder="Como aparece no cartão"
                error={!!newCardErrors.name}
                helperText={newCardErrors.name}
                disabled={addingCard}
              />
            </Grid>
            
            <Grid item xs={6}>
              <TextField
                label="Validade (MM/AA)"
                name="expiry"
                value={newCardData.expiry}
                onChange={handleCardInputChange}
                fullWidth
                placeholder="MM/AA"
                error={!!newCardErrors.expiry}
                helperText={newCardErrors.expiry}
                disabled={addingCard}
                inputProps={{ maxLength: 5 }}
              />
            </Grid>
            
            <Grid item xs={6}>
              <TextField
                label="Código de Segurança"
                name="cvc"
                value={newCardData.cvc}
                onChange={handleCardInputChange}
                fullWidth
                placeholder="CVC"
                error={!!newCardErrors.cvc}
                helperText={newCardErrors.cvc}
                disabled={addingCard}
                inputProps={{ maxLength: 4 }}
                type="password"
              />
            </Grid>
          </Grid>
          
          {addCardError && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {addCardError}
            </Alert>
          )}
          
          <Box sx={{ mt: 3, mb: 1 }}>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', textAlign: 'center' }}>
              Seus dados de pagamento estão seguros e criptografados.
            </Typography>
          </Box>
        </DialogContent>
        
        <DialogActions>
          <Button 
            onClick={handleDialogClose} 
            disabled={addingCard}
          >
            Cancelar
          </Button>
          
          <Button 
            onClick={handleAddCard}
            variant="contained" 
            color="primary"
            disabled={addingCard}
            startIcon={addingCard ? <CircularProgress size={24} /> : null}
          >
            {addingCard ? 'Processando...' : 'Adicionar Cartão'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default PaymentMethodSelector; 