import React from 'react';
import { Button as MuiButton, CircularProgress } from '@mui/material';
import { styled } from '@mui/material/styles';
import PropTypes from 'prop-types';

// Estilização do botão base
const StyledButton = styled(MuiButton)(({ theme, fullWidth, size, variant, color }) => ({
  borderRadius: '12px',
  padding: size === 'small' ? '6px 16px' : size === 'large' ? '12px 24px' : '8px 20px',
  textTransform: 'none',
  fontWeight: 500,
  boxShadow: variant === 'contained' ? theme.shadows[2] : 'none',
  position: 'relative',
  overflow: 'hidden',
  width: fullWidth ? '100%' : 'auto',
  '&:hover': {
    boxShadow: variant === 'contained' ? theme.shadows[4] : 'none',
    transform: 'translateY(-1px)',
    transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
  },
  '&:active': {
    transform: 'translateY(0)',
    boxShadow: variant === 'contained' ? theme.shadows[1] : 'none',
  },
  '&.Mui-disabled': {
    opacity: 0.7,
    backgroundColor: variant === 'contained' ? theme.palette[color].main : 'transparent',
    color: variant === 'contained' ? theme.palette[color].contrastText : theme.palette[color].main,
  },
}));

/**
 * Componente de botão aprimorado
 * Estende o Button do Material UI com opções adicionais
 * 
 * @param {Object} props - Propriedades do componente
 * @param {boolean} props.loading - Estado de carregamento
 * @param {React.ReactNode} props.children - Conteúdo do botão
 */
const Button = ({ loading, children, disabled, startIcon, endIcon, ...props }) => {
  // Definir tamanho do CircularProgress baseado no tamanho do botão
  const spinnerSize = props.size === 'small' ? 16 : props.size === 'large' ? 24 : 20;
  
  // Ajustar ícones quando em estado de carregamento
  const adjustedStartIcon = loading ? null : startIcon;
  const adjustedEndIcon = loading ? null : endIcon;
  
  return (
    <StyledButton
      disabled={disabled || loading}
      startIcon={adjustedStartIcon}
      endIcon={adjustedEndIcon}
      {...props}
    >
      {loading && (
        <CircularProgress
          size={spinnerSize}
          color="inherit"
          thickness={4}
          sx={{
            position: 'absolute',
            left: '50%',
            marginLeft: `-${spinnerSize / 2}px`,
          }}
        />
      )}
      <span style={{ visibility: loading ? 'hidden' : 'visible' }}>
        {children}
      </span>
    </StyledButton>
  );
};

Button.propTypes = {
  /**
   * Indica se o botão está em estado de carregamento
   */
  loading: PropTypes.bool,
  
  /**
   * Conteúdo do botão
   */
  children: PropTypes.node.isRequired,
  
  /**
   * Indica se o botão está desabilitado
   */
  disabled: PropTypes.bool,
  
  /**
   * Ícone exibido antes do texto do botão
   */
  startIcon: PropTypes.node,
  
  /**
   * Ícone exibido após o texto do botão
   */
  endIcon: PropTypes.node,
  
  /**
   * Tipo de botão
   */
  variant: PropTypes.oneOf(['contained', 'outlined', 'text']),
  
  /**
   * Cor do botão
   */
  color: PropTypes.oneOf(['primary', 'secondary', 'error', 'warning', 'info', 'success']),
  
  /**
   * Tamanho do botão
   */
  size: PropTypes.oneOf(['small', 'medium', 'large']),
  
  /**
   * Se o botão deve ocupar toda a largura disponível
   */
  fullWidth: PropTypes.bool,
};

Button.defaultProps = {
  loading: false,
  disabled: false,
  variant: 'contained',
  color: 'primary',
  size: 'medium',
  fullWidth: false,
};

export default Button; 