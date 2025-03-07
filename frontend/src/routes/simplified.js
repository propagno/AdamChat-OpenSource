import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

/**
 * Versão simplificada do roteador para depuração
 * IMPORTANTE: Este componente deve ser usado dentro de um BrowserRouter
 */
const SimpleRouter = () => {
  return (
    <Routes>
      <Route 
        path="/login" 
        element={
          <div style={{ 
            padding: '2rem', 
            maxWidth: '500px', 
            margin: '0 auto', 
            textAlign: 'center',
            boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
            borderRadius: '8px',
            marginTop: '2rem',
            backgroundColor: '#fff'
          }}>
            <h1 style={{ color: '#3f51b5', marginBottom: '1rem' }}>Login do AdamChat</h1>
            <p>Esta é uma versão simplificada da página de login para diagnóstico.</p>
            <form style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
              <input 
                type="email" 
                placeholder="Email" 
                style={{ padding: '0.75rem', borderRadius: '4px', border: '1px solid #ccc' }}
              />
              <input 
                type="password" 
                placeholder="Senha" 
                style={{ padding: '0.75rem', borderRadius: '4px', border: '1px solid #ccc' }}
              />
              <button 
                type="button" 
                style={{ 
                  padding: '0.75rem', 
                  backgroundColor: '#3f51b5', 
                  color: 'white', 
                  border: 'none', 
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Entrar
              </button>
            </form>
          </div>
        } 
      />
      
      {/* Rota para a raiz que redireciona para login */}
      <Route path="/" element={<Navigate to="/login" replace />} />

      {/* Rota curinga para capturar todas as outras URLs */}
      <Route path="*" element={
        <div style={{
          padding: '2rem',
          maxWidth: '500px',
          margin: '2rem auto',
          textAlign: 'center',
          backgroundColor: '#fff',
          boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
          borderRadius: '8px'
        }}>
          <h1 style={{ color: '#f44336' }}>Página não encontrada</h1>
          <p>A página que você está procurando não existe ou foi movida.</p>
          <button
            onClick={() => window.location.href = '/login'}
            style={{
              marginTop: '1rem',
              padding: '0.5rem 1rem',
              backgroundColor: '#3f51b5',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Ir para o Login
          </button>
        </div>
      } />
    </Routes>
  );
};

export default SimpleRouter; 