import React from 'react';
import { Box, Typography, Divider, Link, Paper } from '@mui/material';

/**
 * Componente que exibe dicas de ajuda quando há problemas de login
 * @param {Object} props - Propriedades do componente
 * @param {string} props.errorType - Tipo de erro (credenciais, network, etc)
 */
const LoginErrorHelp = ({ errorType }) => {
  // Diferentes mensagens de ajuda baseadas no tipo de erro
  const helpContent = {
    credentials: (
      <>
        <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
          Dicas para resolver problemas com credenciais:
        </Typography>
        <Box component="ul" sx={{ pl: 2, mt: 1 }}>
          <li>Verifique se o email está digitado corretamente</li>
          <li>A senha diferencia maiúsculas de minúsculas</li>
          <li>Verifique se o Caps Lock está ativado</li>
          <li>Se esqueceu sua senha, use a opção "Esqueceu sua senha?"</li>
          <li>Caso não possua uma conta, cadastre-se clicando em "Criar conta"</li>
        </Box>
      </>
    ),
    network: (
      <>
        <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
          Dicas para resolver problemas de conexão:
        </Typography>
        <Box component="ul" sx={{ pl: 2, mt: 1 }}>
          <li>Verifique sua conexão com a internet</li>
          <li>O servidor pode estar temporariamente indisponível, tente novamente em alguns minutos</li>
          <li>Tente atualizar a página</li>
          <li>Se o problema persistir, entre em contato com o suporte</li>
        </Box>
      </>
    ),
    oauth: (
      <Box>
        <Typography variant="subtitle1" fontWeight="medium" gutterBottom>
          Dicas para resolver problemas de login social:
        </Typography>
        <Box component="ul" sx={{ pl: 2, mt: 1 }}>
          <Box component="li" sx={{ mb: 1 }}>
            Verifique se você permitiu o acesso à sua conta no provedor social.
          </Box>
          <Box component="li" sx={{ mb: 1 }}>
            Certifique-se de que seu email no provedor social está verificado.
          </Box>
          <Box component="li" sx={{ mb: 1 }}>
            Tente limpar os cookies do navegador e tentar novamente.
          </Box>
          <Box component="li" sx={{ mb: 1 }}>
            Se você já tem uma conta com o mesmo email, tente fazer login com senha.
          </Box>
          <Box component="li">
            Tente usar outro provedor social ou o método tradicional de login.
          </Box>
        </Box>
      </Box>
    ),
    general: (
      <>
        <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
          Dicas para resolver problemas de login:
        </Typography>
        <Box component="ul" sx={{ pl: 2, mt: 1 }}>
          <li>Limpe o cache e cookies do navegador</li>
          <li>Tente usar outro navegador</li>
          <li>Verifique se seu navegador está atualizado</li>
          <li>Tente novamente mais tarde</li>
        </Box>
      </>
    )
  };

  // Escolhe o conteúdo adequado ou usa o conteúdo geral por padrão
  const content = helpContent[errorType] || helpContent.general;

  return (
    <Paper 
      elevation={0} 
      sx={{ 
        mt: 2, 
        p: 2, 
        bgcolor: 'rgba(0, 0, 0, 0.02)', 
        border: '1px solid rgba(0, 0, 0, 0.05)',
        borderRadius: 1
      }}
    >
      <Typography variant="body2" color="text.secondary" paragraph>
        Estamos notando dificuldades no seu login. Aqui estão algumas sugestões que podem ajudar:
      </Typography>
      
      {content}
      
      <Divider sx={{ my: 1.5 }} />
      
      <Typography variant="body2" color="text.secondary">
        Se continuar enfrentando problemas, entre em contato com o 
        <Link href="mailto:suporte@adamchat.com" sx={{ ml: 0.5 }}>
          suporte técnico
        </Link>.
      </Typography>
    </Paper>
  );
};

export default LoginErrorHelp; 