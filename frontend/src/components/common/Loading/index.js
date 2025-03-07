import React from 'react';
import { CircularProgress, Box, Typography } from '@mui/material';

/**
 * A reusable loading component to display during async operations
 */
const Loading = ({ message = 'Carregando...' }) => {
  return (
    <Box sx={{ 
      display: 'flex', 
      flexDirection: 'column',
      alignItems: 'center', 
      justifyContent: 'center',
      height: '100vh'
    }}>
      <CircularProgress size={60} />
      <Typography variant="h6" sx={{ mt: 2 }}>
        {message}
      </Typography>
    </Box>
  );
};

export default Loading; 