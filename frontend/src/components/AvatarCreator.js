import React from 'react';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Button,
  Grid,
  Paper
} from '@mui/material';
import ConstructionIcon from '@mui/icons-material/Construction';

const AvatarCreator = () => {
  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Criador de Avatares com IA
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Crie avatares personalizados usando inteligência artificial avançada.
        </Typography>
      </Box>

      <Paper sx={{ p: 4, textAlign: 'center' }}>
        <ConstructionIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
        
        <Typography variant="h5" gutterBottom>
          Funcionalidade em Construção
        </Typography>
        
        <Typography variant="body1" sx={{ maxWidth: 600, mx: 'auto', mb: 4 }}>
          Estamos trabalhando na implementação do criador de avatares com IA. Esta funcionalidade estará disponível em breve. Fique atento às atualizações!
        </Typography>
        
        <Grid container spacing={3} justifyContent="center" sx={{ mt: 2 }}>
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  O que esperar:
                </Typography>
                <ul style={{ textAlign: 'left', paddingLeft: '20px' }}>
                  <li>Crie avatares fotorrealísticos de si mesmo</li>
                  <li>Escolha entre diversos estilos e temas</li>
                  <li>Gere variações de roupas e ambientes</li>
                  <li>Exporte em alta resolução para uso profissional</li>
                </ul>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Aplicações:
                </Typography>
                <ul style={{ textAlign: 'left', paddingLeft: '20px' }}>
                  <li>Redes sociais e perfis profissionais</li>
                  <li>Marketing pessoal e branding</li>
                  <li>Representação digital consistente</li>
                  <li>Conteúdo para sites e blogs</li>
                </ul>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
        
        <Button 
          variant="contained" 
          color="primary" 
          sx={{ mt: 4 }}
          onClick={() => window.history.back()}
        >
          Voltar para Dashboard
        </Button>
      </Paper>
    </Container>
  );
};

export default AvatarCreator; 