const { createProxyMiddleware } = require("http-proxy-middleware");

module.exports = function(app) {
  // No Docker, usar o nome do serviço como hostname
  const target = 'http://backend:5000';
  
  console.log(`Configurando proxy para o backend em: ${target} (ambiente Docker)`);
  
  app.use(
    "/api",
    createProxyMiddleware({
      target: target,
      changeOrigin: true,
      logLevel: "debug",
      // Aumentar o timeout para evitar erros
      timeout: 60000,
      // Adicionar headers para debugging
      onProxyReq: (proxyReq, req, res) => {
        // Adicionar headers personalizados para debugging
        proxyReq.setHeader('X-Proxy-Request', 'true');
        console.log(`Proxy: ${req.method} ${req.url} -> ${target}${req.url}`);
      },
      // Tratar erros de proxy
      onError: (err, req, res) => {
        console.error('Erro de proxy:', err);
        res.writeHead(500, {
          'Content-Type': 'application/json',
        });
        res.end(JSON.stringify({
          status: 'error',
          message: `Erro ao conectar ao backend: ${err.message}`,
          error: err.code
        }));
      }
    })
  );
}; 