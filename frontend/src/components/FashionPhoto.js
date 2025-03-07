import React from 'react';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  CardMedia,
  Button,
  Grid,
  Paper
} from '@mui/material';
import ConstructionIcon from '@mui/icons-material/Construction';

const FashionPhoto = () => {
  // Exemplos de imagens que seriam geradas
  const exampleImages = [
    {
      title: 'Estilo Urbano',
      description: 'Fotografia de moda urbana com uma modelo em ambiente urbano',
      image: 'https://source.unsplash.com/random/400x500/?urban,fashion'
    },
    {
      title: 'Estilo Elegante',
      description: 'Fotografia de moda elegante em ambiente sofisticado',
      image: 'https://source.unsplash.com/random/400x500/?elegant,fashion'
    },
    {
      title: 'Estilo Casual',
      description: 'Fotografia de moda casual em ambiente natural',
      image: 'https://source.unsplash.com/random/400x500/?casual,fashion'
    }
  ];

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Fotos Fashion com IA
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Crie fotografias de moda profissionais com inteligência artificial. Transforme suas ideias em imagens de alta qualidade.
        </Typography>
      </Box>

      <Paper sx={{ p: 4, textAlign: 'center', mb: 4 }}>
        <ConstructionIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
        
        <Typography variant="h5" gutterBottom>
          Funcionalidade em Desenvolvimento
        </Typography>
        
        <Typography variant="body1" sx={{ maxWidth: 600, mx: 'auto', mb: 4 }}>
          Estamos finalizando os últimos detalhes da nossa ferramenta de geração de fotos fashion com IA. Esta funcionalidade estará disponível muito em breve!
        </Typography>
        
        <Button 
          variant="contained" 
          color="primary" 
          sx={{ mt: 2 }}
          onClick={() => window.history.back()}
        >
          Voltar para Dashboard
        </Button>
      </Paper>

      <Typography variant="h5" gutterBottom sx={{ mt: 6, mb: 3 }}>
        Preview: Exemplos de Fotos Fashion
      </Typography>
      
      <Grid container spacing={3}>
        {exampleImages.map((example, index) => (
          <Grid item xs={12} sm={6} md={4} key={index}>
            <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <CardMedia
                component="img"
                height="300"
                image={example.image}
                alt={example.title}
              />
              <CardContent sx={{ flexGrow: 1 }}>
                <Typography gutterBottom variant="h6" component="div">
                  {example.title}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {example.description}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Box sx={{ mt: 6 }}>
        <Typography variant="h5" gutterBottom>
          Recursos que você terá em breve:
        </Typography>
        
        <Grid container spacing={3} sx={{ mt: 2 }}>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" color="primary" gutterBottom>
                  Criação Personalizada
                </Typography>
                <Typography variant="body2" paragraph>
                  Gere fotos fashion personalizadas a partir de descrições textuais detalhadas. Especifique:
                </Typography>
                <ul>
                  <li>Estilo de roupa e acessórios</li>
                  <li>Postura e expressão do modelo</li>
                  <li>Ambientação e iluminação</li>
                  <li>Paleta de cores e mood da foto</li>
                </ul>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" color="primary" gutterBottom>
                  Aplicações Profissionais
                </Typography>
                <Typography variant="body2" paragraph>
                  Utilize as fotos geradas para:
                </Typography>
                <ul>
                  <li>E-commerce e marketplaces de moda</li>
                  <li>Catálogos e lookbooks digitais</li>
                  <li>Redes sociais e marketing digital</li>
                  <li>Blogs e sites de moda</li>
                  <li>Referências de styling e mood boards</li>
                </ul>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>
    </Container>
  );
};

export default FashionPhoto; 