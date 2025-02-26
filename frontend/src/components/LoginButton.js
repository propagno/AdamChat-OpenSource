// src/components/LoginButton.js
import React from 'react';
import { useKeycloak } from '@react-keycloak/web';
import { Button } from '@mui/material';

const LoginButton = () => {
  const { keycloak } = useKeycloak();
  return (
    <Button color="inherit" onClick={() => keycloak.login()}>
      Login com Keycloak
    </Button>
  );
};

export default LoginButton;
