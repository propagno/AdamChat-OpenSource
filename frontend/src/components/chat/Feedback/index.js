import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import './styles.css';

/**
 * Tipos de feedback disponíveis
 */
export const FEEDBACK_TYPES = {
  SUCCESS: 'success',
  ERROR: 'error',
  WARNING: 'warning',
  INFO: 'info',
};

/**
 * Contexto global para o componente de feedback
 */
export const FeedbackContext = React.createContext({
  showFeedback: () => {},
  hideFeedback: () => {},
});

/**
 * Hook personalizado para usar o feedback em qualquer componente
 */
export const useFeedback = () => React.useContext(FeedbackContext);

/**
 * Componente de feedback (toast) para exibir mensagens ao usuário
 */
const Feedback = ({ message, type = FEEDBACK_TYPES.INFO, duration = 5000, onClose }) => {
  const [visible, setVisible] = useState(true);
  
  const handleClose = useCallback(() => {
    setVisible(false);
    setTimeout(() => {
      onClose && onClose();
    }, 300); // Tempo para a animação de saída completar
  }, [onClose]);
  
  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        handleClose();
      }, duration);
      
      return () => clearTimeout(timer);
    }
  }, [duration, handleClose]);
  
  return (
    <div className={`feedback ${type} ${visible ? 'show' : 'hide'}`}>
      <div className="feedback-content">
        <div className="feedback-icon">
          {type === FEEDBACK_TYPES.SUCCESS && '✓'}
          {type === FEEDBACK_TYPES.ERROR && '✗'}
          {type === FEEDBACK_TYPES.WARNING && '⚠️'}
          {type === FEEDBACK_TYPES.INFO && 'ℹ️'}
        </div>
        <p className="feedback-message">{message}</p>
      </div>
      <button className="feedback-close" onClick={handleClose}>×</button>
    </div>
  );
};

/**
 * Container para múltiplos feedbacks
 */
export const FeedbackContainer = ({ children }) => {
  const [feedbacks, setFeedbacks] = useState([]);
  
  const showFeedback = useCallback((message, type = FEEDBACK_TYPES.INFO, duration = 5000) => {
    const id = Date.now();
    setFeedbacks(prev => [...prev, { id, message, type, duration }]);
    return id;
  }, []);
  
  const hideFeedback = useCallback((id) => {
    setFeedbacks(prev => prev.filter(feedback => feedback.id !== id));
  }, []);
  
  const contextValue = {
    showFeedback,
    hideFeedback,
  };
  
  return (
    <FeedbackContext.Provider value={contextValue}>
      {children}
      <div className="feedback-container">
        {feedbacks.map(feedback => (
          <Feedback
            key={feedback.id}
            message={feedback.message}
            type={feedback.type}
            duration={feedback.duration}
            onClose={() => hideFeedback(feedback.id)}
          />
        ))}
      </div>
    </FeedbackContext.Provider>
  );
};

export default Feedback; 