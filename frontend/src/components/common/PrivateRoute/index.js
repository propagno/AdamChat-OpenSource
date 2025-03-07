// src/components/PrivateRoute.js
import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import Loading from '../Loading';

/**
 * Componente de rota privada que verifica a autenticação do usuário
 * antes de renderizar o conteúdo protegido
 */
const PrivateRoute = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  
  // Check if authentication is still loading
  if (isLoading) {
    return <Loading message="Verificando autenticação..." />;
  }
  
  // If not authenticated, redirect to login page
  if (!isAuthenticated) {
    console.log('PrivateRoute: User not authenticated, redirecting to login page');
    return <Navigate to="/" replace />;
  }
  
  // If authenticated, render the protected content
  console.log('PrivateRoute: User is authenticated, rendering protected content');
  return children || <Outlet />;
};

export default PrivateRoute;
