// src/components/layout/Dashboard/index.js
import React from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { Link } from 'react-router-dom';
import './styles.css';

const Dashboard = () => {
  const { user } = useAuth();
  
  const username = user?.username || 'Usuário';
  
  // Lista de recursos da aplicação
  const appResources = [
    {
      id: 'chat',
      title: 'Chat IA',
      description: 'Converse com nossa IA para obter respostas rápidas e relevantes.',
      icon: '💬',
      path: '/chat'
    },
    {
      id: 'ficha',
      title: 'Fichas de Pacientes',
      description: 'Acesse e gerencie informações de seus pacientes.',
      icon: '📝',
      path: '/ficha-paciente'
    },
    {
      id: 'ebook',
      title: 'Geração de E-books',
      description: 'Crie e-books personalizados com ajuda da inteligência artificial.',
      icon: '📚',
      path: '/ebook-generator'
    },
    {
      id: 'biblioteca',
      title: 'Biblioteca de E-books',
      description: 'Acesse sua coleção de e-books criados anteriormente.',
      icon: '📖',
      path: '/ebook-library'
    }
  ];
  
  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1>Dashboard</h1>
        <p className="welcome-message">Bem-vindo, <strong>{username}</strong>!</p>
      </div>
      
      <div className="dashboard-stats">
        <div className="stat-card">
          <div className="stat-value">0</div>
          <div className="stat-label">Chats Ativos</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">0</div>
          <div className="stat-label">Fichas Criadas</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">0</div>
          <div className="stat-label">E-books Gerados</div>
        </div>
      </div>
      
      <h2 className="section-title">Recursos Disponíveis</h2>
      
      <div className="resource-grid">
        {appResources.map(resource => (
          <Link to={resource.path} className="resource-card" key={resource.id}>
            <div className="resource-icon">{resource.icon}</div>
            <h3 className="resource-title">{resource.title}</h3>
            <p className="resource-description">{resource.description}</p>
          </Link>
        ))}
      </div>
      
      <div className="quick-actions">
        <h2 className="section-title">Ações Rápidas</h2>
        <div className="action-buttons">
          <Link to="/chat" className="action-button">Novo Chat</Link>
          <Link to="/ficha-paciente" className="action-button">Nova Ficha</Link>
          <Link to="/ebook-generator" className="action-button">Novo E-book</Link>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
