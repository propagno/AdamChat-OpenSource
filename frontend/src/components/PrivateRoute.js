// src/components/PrivateRoute.js
import React from 'react';
import { useKeycloak } from '@react-keycloak/web';
import { Navigate, Outlet } from 'react-router-dom';

const PrivateRoute = () => {
  const { keycloak, initialized } = useKeycloak();

  if (!initialized) {
    return <div>Carregando...</div>;
  }

  return keycloak.authenticated ? <Outlet /> : <Navigate to="/" />;
};

export default PrivateRoute;
