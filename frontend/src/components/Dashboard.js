// src/components/Dashboard.js
import React from 'react';
import { Typography, Box, Card, CardContent } from '@mui/material';

const Dashboard = () => {
  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>Dashboard</Typography>
      
      <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
        <Card sx={{ minWidth: 275 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Atividades Recentes
            </Typography>
            <Typography variant="body2">
              Aqui serão exibidas as atividades recentes do usuário.
            </Typography>
          </CardContent>
        </Card>
        
        <Card sx={{ minWidth: 275 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Métricas de Uso
            </Typography>
            <Typography variant="body2">
              Aqui serão exibidas as métricas de uso e outras estatísticas.
            </Typography>
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
};

export default Dashboard;
