// src/components/PrivateRoute.js
import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
// Removendo a importação do Keycloak
// import { useKeycloak } from '@react-keycloak/web';
// Importando nosso hook de autenticação
import { useAuth } from '../contexts/AuthContext';
import Loading from './Loading';

/**
 * Componente de rota privada que verifica a autenticação do usuário
 * antes de renderizar o conteúdo protegido
 */
const PrivateRoute = ({ children }) => {
  // Substituindo o Keycloak pelo nosso contexto de autenticação
  const { isAuthenticated, isLoading } = useAuth();
  
  // Enquanto a autenticação está sendo verificada, mostra o componente de carregamento
  if (isLoading) {
    return <Loading message="Verificando autenticação..." />;
  }
  
  // Se não estiver autenticado, redireciona para a página inicial
  if (!isAuthenticated) {
    console.log('Usuário não autenticado, redirecionando para a página inicial');
    return <Navigate to="/" replace />;
  }
  
  // Se estiver autenticado, renderiza o conteúdo protegido
  return children || <Outlet />;
};

export default PrivateRoute;
