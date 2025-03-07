const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  console.log('Setting up enhanced proxy middleware with OAuth support');
  
  // Configuração avançada do proxy com melhor suporte a timeout e diagnóstico
  app.use('/api', createProxyMiddleware({
    target: 'http://backend-dev:5000',
    changeOrigin: true,
    secure: false,
    logLevel: 'debug',
    timeout: 120000, // 2 minutos de timeout
    proxyTimeout: 120000,
    // Opções para melhorar a estabilidade
    followRedirects: true,
    xfwd: true, // Encaminha headers originais
    // Funções para logging e diagnóstico
    onProxyReq: (proxyReq, req) => {
      console.log(`[Proxy Request] ${req.method} ${req.originalUrl}`);
      // Adicionar headers úteis para debugging no backend
      proxyReq.setHeader('X-Forwarded-From', 'frontend-dev');
      proxyReq.setHeader('X-Original-URL', req.originalUrl);
    },
    onProxyRes: (proxyRes, req) => {
      console.log(`[Proxy Response] ${req.method} ${req.originalUrl} => Status: ${proxyRes.statusCode}`);
    },
    onError: (err, req, res) => {
      console.error(`[Proxy Error] ${req.method} ${req.originalUrl}`, err);
      // Fornecer uma resposta amigável em caso de erro
      res.writeHead(500, {
        'Content-Type': 'application/json',
      });
      res.end(JSON.stringify({
        status: 'error',
        message: 'Erro de comunicação com o servidor. Verifique se o backend está em execução.',
        code: 500,
        path: req.originalUrl,
        error: err.message
      }));
    }
  }));

  console.log('Proxy middleware setup complete');
};
