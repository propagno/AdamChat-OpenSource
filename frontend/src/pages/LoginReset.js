import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { clearAllCookies, clearStorage } from '../services/auth';

const LoginReset = () => {
  const [status, setStatus] = useState('Iniciando limpeza de dados...');
  const [completed, setCompleted] = useState(false);
  const navigate = useNavigate();
  const { logout } = useAuth();

  useEffect(() => {
    const resetLogin = async () => {
      try {
        setStatus('Limpando cookies...');
        clearAllCookies();
        
        setStatus('Limpando localStorage e sessionStorage...');
        clearStorage();
        
        setStatus('Deslogando do sistema...');
        await logout();
        
        setStatus('Limpeza completa! Redirecionando para a página inicial em 5 segundos...');
        setCompleted(true);
        
        setTimeout(() => {
          navigate('/');
        }, 5000);
      } catch (error) {
        console.error('Erro durante a limpeza:', error);
        setStatus(`Erro durante a limpeza: ${error.message}`);
      }
    };

    resetLogin();
  }, [navigate, logout]);

  const handleManualRedirect = () => {
    navigate('/');
  };

  return (
    <div className="login-reset-container" style={styles.container}>
      <div className="login-reset-card" style={styles.card}>
        <h2 style={styles.title}>Reinicialização de Login</h2>
        <div className="status" style={styles.status}>
          <p>{status}</p>
          {completed && (
            <div className="progress" style={styles.progressBar}>
              <div 
                className="progress-bar" 
                style={{
                  ...styles.progressBarInner,
                  animation: 'progress 5s linear'
                }}
              />
            </div>
          )}
        </div>
        {completed && (
          <button 
            onClick={handleManualRedirect}
            style={styles.button}
          >
            Ir para página inicial agora
          </button>
        )}
        <div style={styles.info}>
          <h3>O que está acontecendo?</h3>
          <p>Esta página está:</p>
          <ul>
            <li>Removendo todos os cookies relacionados à autenticação</li>
            <li>Limpando dados de login armazenados no navegador</li>
            <li>Desconectando você do serviço de autenticação</li>
            <li>Preparando seu navegador para um novo login limpo</li>
          </ul>
          <p><strong>Nota:</strong> Se você continuar enfrentando problemas de login após este processo, considere limpar os cookies do seu navegador manualmente ou entre em contato com o suporte.</p>
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100vh',
    backgroundColor: '#f5f5f5',
    padding: '20px'
  },
  card: {
    backgroundColor: 'white',
    borderRadius: '8px',
    boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
    padding: '30px',
    maxWidth: '600px',
    width: '100%'
  },
  title: {
    color: '#333',
    marginBottom: '20px',
    textAlign: 'center'
  },
  status: {
    padding: '15px',
    backgroundColor: '#f8f9fa',
    borderRadius: '4px',
    marginBottom: '20px',
    textAlign: 'center'
  },
  progressBar: {
    height: '5px',
    backgroundColor: '#e9ecef',
    borderRadius: '3px',
    overflow: 'hidden',
    marginTop: '10px'
  },
  progressBarInner: {
    height: '100%',
    backgroundColor: '#007bff',
    width: '0%',
    animation: 'progress 5s linear',
    animationFillMode: 'forwards'
  },
  button: {
    backgroundColor: '#007bff',
    color: 'white',
    border: 'none',
    padding: '10px 15px',
    borderRadius: '4px',
    cursor: 'pointer',
    width: '100%',
    marginBottom: '20px',
    fontWeight: 'bold'
  },
  info: {
    backgroundColor: '#f8f9fa',
    padding: '15px',
    borderRadius: '4px',
    fontSize: '14px'
  }
};

export default LoginReset; 