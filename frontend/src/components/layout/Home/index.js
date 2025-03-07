import React, { useState } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { Navigate, Link } from 'react-router-dom';
import './styles.css';

const Home = () => {
  const { isAuthenticated, login, loading } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showLoginForm, setShowLoginForm] = useState(false);
  
  // Se já está autenticado, redireciona para o dashboard
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }
  
  const handleLogin = async () => {
    if (showLoginForm) {
      if (username && password) {
        await login({ username, password });
      }
    } else {
      setShowLoginForm(true);
    }
  };
  
  return (
    <div className="home-container">
      <div className="home-content">
        <h1>Bem-vindo ao AdamChat</h1>
        <p className="home-description">
          Plataforma integrada para gerenciamento de atendimentos e geração de conteúdo com IA.
        </p>
        
        <div className="home-features">
          <div className="feature-card">
            <div className="feature-icon">💬</div>
            <h3>Chat com IA</h3>
            <p>Interaja com modelos avançados de IA para obter respostas rápidas.</p>
          </div>
          
          <div className="feature-card">
            <div className="feature-icon">📝</div>
            <h3>Fichas de Pacientes</h3>
            <p>Gerencie informações de pacientes de forma segura e eficiente.</p>
          </div>
          
          <div className="feature-card">
            <div className="feature-icon">📚</div>
            <h3>Geração de E-books</h3>
            <p>Crie conteúdo personalizado com ajuda da inteligência artificial.</p>
          </div>
        </div>
        
        {showLoginForm ? (
          <div className="login-form">
            <input
              type="text"
              placeholder="Nome de usuário"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="login-input"
            />
            <input
              type="password"
              placeholder="Senha"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="login-input"
            />
            <button 
              className="login-button" 
              onClick={handleLogin}
              disabled={loading}
            >
              {loading ? 'Entrando...' : 'Entrar'}
            </button>
            <button 
              className="cancel-button" 
              onClick={() => setShowLoginForm(false)}
            >
              Cancelar
            </button>
          </div>
        ) : (
          <button 
            className="login-button" 
            onClick={handleLogin}
          >
            Entrar na Plataforma
          </button>
        )}
        
        {loading && (
          <p className="loading-text">Conectando ao serviço de autenticação...</p>
        )}
        
        <div className="login-help">
          <p>Problemas para entrar? <Link to="/login-reset" className="reset-link">Limpar dados de login</Link> ou <Link to="/auth-diagnostic" className="diagnostic-link">Diagnóstico de autenticação</Link></p>
        </div>
      </div>
    </div>
  );
};

export default Home; 