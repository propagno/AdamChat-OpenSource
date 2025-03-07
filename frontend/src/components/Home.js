import React from 'react';
import { useKeycloak } from '@react-keycloak/web';
import { Navigate, Link } from 'react-router-dom';
import './Home.css';

const Home = () => {
  const { keycloak, initialized } = useKeycloak();
  
  // Se já está autenticado, redireciona para o dashboard
  if (initialized && keycloak.authenticated) {
    return <Navigate to="/dashboard" replace />;
  }
  
  const handleLogin = () => {
    keycloak.login();
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
        
        <button 
          className="login-button" 
          onClick={handleLogin}
          disabled={!initialized}
        >
          Entrar na Plataforma
        </button>
        
        {!initialized && (
          <p className="loading-text">Conectando ao serviço de autenticação...</p>
        )}
      </div>
      <div className="container">
        <div className="row mt-4">
          <div className="col-12 text-center">
            <Link to="/auth-diagnostic" className="btn btn-info">
              Diagnóstico de Autenticação
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home; 