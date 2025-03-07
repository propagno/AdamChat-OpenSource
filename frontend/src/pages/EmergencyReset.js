import React, { useEffect, useState } from 'react';

// Função para limpar todos os cookies
const clearAllCookies = () => {
  const cookies = document.cookie.split(';');
  
  for (let i = 0; i < cookies.length; i++) {
    const cookie = cookies[i];
    const eqPos = cookie.indexOf('=');
    const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim();
    
    // Remover o cookie com diferentes paths e domains
    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/auth`;
    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/realms`;
    
    // Tentar com o domínio atual
    const domain = window.location.hostname;
    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; domain=${domain}`;
    
    // Tentar com 127.0.0.1 especificamente
    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; domain=127.0.0.1`;
  }
  
  return cookies.length;
};

// Função para limpar todo o localStorage e sessionStorage
const clearAllStorage = () => {
  try {
    // Armazenar número de itens removidos
    const localStorageCount = localStorage.length;
    const sessionStorageCount = sessionStorage.length;
    
    // Limpar tudo
    localStorage.clear();
    sessionStorage.clear();
    
    return { localStorageCount, sessionStorageCount };
  } catch (e) {
    console.error('Erro ao limpar storage:', e);
    return { localStorageCount: 0, sessionStorageCount: 0, error: e.message };
  }
};

// Página principal - esta página não usa o contexto ReactKeycloak
const EmergencyReset = () => {
  const [results, setResults] = useState(null);
  const [resetComplete, setResetComplete] = useState(false);
  const [countdown, setCountdown] = useState(null);

  // Realizar reset de emergência
  const performEmergencyReset = () => {
    try {
      // Limpar cookies
      const cookiesCleared = clearAllCookies();
      
      // Limpar storages
      const storageCleared = clearAllStorage();
      
      // Armazenar resultados para exibição
      setResults({
        cookiesCleared,
        localStorageCleared: storageCleared.localStorageCount,
        sessionStorageCleared: storageCleared.sessionStorageCount,
        error: storageCleared.error,
        timestamp: new Date().toISOString()
      });
      
      // Marcar como concluído
      setResetComplete(true);
      
      // Configurar cronômetro para redirecionamento
      setCountdown(5);
      
      // Registrar no sessionStorage que um reset de emergência foi realizado
      try {
        sessionStorage.setItem('emergency-reset-performed', 'true');
        sessionStorage.setItem('emergency-reset-time', new Date().toISOString());
      } catch (e) {
        console.error('Erro ao definir flag de reset de emergência:', e);
      }
      
      return true;
    } catch (e) {
      console.error('Erro ao executar reset de emergência:', e);
      setResults({
        error: e.message,
        timestamp: new Date().toISOString()
      });
      return false;
    }
  };

  useEffect(() => {
    // Iniciar o cronômetro se o reset estiver completo
    let timer;
    if (resetComplete && countdown !== null) {
      if (countdown > 0) {
        timer = setTimeout(() => {
          setCountdown(countdown - 1);
        }, 1000);
      } else {
        // Redirecionar para a página inicial após o término do cronômetro
        window.location.replace(window.location.origin);
      }
    }
    
    return () => {
      if (timer) {
        clearTimeout(timer);
      }
    };
  }, [resetComplete, countdown]);

  // Impedir que esta página seja recarregada ou deixada
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (!resetComplete) {
        // Cancel the event
        e.preventDefault();
        // Chrome requires returnValue to be set
        e.returnValue = '';
      }
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [resetComplete]);

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>Reset de Emergência</h1>
        <p style={styles.warning}>
          Esta página foi projetada para quebrar completamente qualquer ciclo de autenticação.
          Ela limpa todos os cookies e dados de armazenamento do navegador relacionados à autenticação.
        </p>
        
        {!resetComplete ? (
          <div style={styles.actionSection}>
            <p style={styles.description}>
              Se você está preso em um loop de autenticação e não consegue acessar sua conta,
              este botão irá limpar todos os dados de autenticação e permitir que você comece novamente.
            </p>
            
            <button 
              style={styles.resetButton} 
              onClick={performEmergencyReset}
            >
              Realizar Reset de Emergência
            </button>
            
            <div style={styles.note}>
              <strong>Nota:</strong> Isto removerá todos os cookies e dados de armazenamento relacionados à autenticação.
              Você precisará fazer login novamente após este procedimento.
            </div>
          </div>
        ) : (
          <div style={styles.completedSection}>
            <div style={styles.successMessage}>
              <div style={styles.checkmark}>✓</div>
              <h2>Reset Completo!</h2>
            </div>
            
            <div style={styles.results}>
              <p><strong>Cookies removidos:</strong> {results.cookiesCleared}</p>
              <p><strong>Itens de localStorage removidos:</strong> {results.localStorageCleared}</p>
              <p><strong>Itens de sessionStorage removidos:</strong> {results.sessionStorageCleared}</p>
              {results.error && <p style={styles.error}><strong>Erro:</strong> {results.error}</p>}
              <p><strong>Horário:</strong> {new Date(results.timestamp).toLocaleString()}</p>
            </div>
            
            <div style={styles.redirectMessage}>
              <p>Redirecionando para a página inicial em <span style={styles.countdown}>{countdown}</span> segundos...</p>
              <button 
                style={styles.redirectButton}
                onClick={() => window.location.replace(window.location.origin)}
              >
                Ir para a página inicial agora
              </button>
            </div>
          </div>
        )}
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
    backgroundColor: '#f8f9fa',
    padding: '20px',
    boxSizing: 'border-box'
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: '8px',
    boxShadow: '0 4px 15px rgba(0, 0, 0, 0.1)',
    padding: '30px',
    maxWidth: '600px',
    width: '100%'
  },
  title: {
    textAlign: 'center',
    color: '#d32f2f',
    marginBottom: '20px',
    fontSize: '28px'
  },
  warning: {
    backgroundColor: '#ffebee',
    border: '1px solid #ffcdd2',
    borderRadius: '4px',
    padding: '15px',
    color: '#c62828',
    marginBottom: '25px',
    fontSize: '16px',
    lineHeight: '1.5'
  },
  description: {
    fontSize: '16px',
    lineHeight: '1.6',
    color: '#333',
    marginBottom: '25px'
  },
  actionSection: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center'
  },
  resetButton: {
    backgroundColor: '#d32f2f',
    color: 'white',
    border: 'none',
    padding: '12px 24px',
    borderRadius: '4px',
    fontSize: '16px',
    fontWeight: 'bold',
    cursor: 'pointer',
    transition: 'background-color 0.3s',
    marginBottom: '20px'
  },
  note: {
    backgroundColor: '#fff8e1',
    border: '1px solid #ffe082',
    borderRadius: '4px',
    padding: '12px',
    fontSize: '14px',
    color: '#ff8f00',
    marginTop: '15px',
    width: '100%',
    boxSizing: 'border-box'
  },
  completedSection: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center'
  },
  successMessage: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    marginBottom: '20px'
  },
  checkmark: {
    width: '60px',
    height: '60px',
    borderRadius: '50%',
    background: '#4caf50',
    color: 'white',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    fontSize: '30px',
    marginBottom: '15px'
  },
  results: {
    backgroundColor: '#e8f5e9',
    border: '1px solid #c8e6c9',
    borderRadius: '4px',
    padding: '15px',
    marginBottom: '25px',
    width: '100%',
    boxSizing: 'border-box'
  },
  error: {
    color: '#d32f2f'
  },
  redirectMessage: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    marginTop: '10px'
  },
  countdown: {
    fontWeight: 'bold',
    fontSize: '18px',
    color: '#d32f2f'
  },
  redirectButton: {
    backgroundColor: '#2196f3',
    color: 'white',
    border: 'none',
    padding: '10px 20px',
    borderRadius: '4px',
    fontSize: '14px',
    cursor: 'pointer',
    marginTop: '15px',
    transition: 'background-color 0.3s'
  }
};

export default EmergencyReset; 