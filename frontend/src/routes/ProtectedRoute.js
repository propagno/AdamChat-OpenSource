import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Loading } from '../components/common';

/**
 * Componente para proteger rotas que requerem autenticação
 * Redireciona para a página de login se o usuário não estiver autenticado
 * 
 * @param {Object} props - Propriedades do componente
 * @param {React.ReactNode} props.children - Componentes filhos a serem renderizados se autenticado
 * @returns {JSX.Element} O componente filho ou redirecionamento
 */
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, isLoading, checkAuth } = useAuth();
  const [checking, setChecking] = useState(true);
  const location = useLocation();
  
  useEffect(() => {
    const verifyAuth = async () => {
      // Verificar autenticação atual
      await checkAuth();
      setChecking(false);
    };
    
    verifyAuth();
  }, [checkAuth]);
  
  // Mostrar loading enquanto verifica autenticação
  if (isLoading || checking) {
    return <Loading message="Verificando autenticação..." fullPage />;
  }
  
  // Redirecionar para login se não estiver autenticado
  if (!isAuthenticated) {
    // Salvar a rota atual para redirecionar de volta após o login
    return (
      <Navigate 
        to="/login" 
        state={{ from: location.pathname }} 
        replace 
      />
    );
  }
  
  // Se estiver autenticado, renderizar os componentes filhos
  return children;
};

export default ProtectedRoute; 