const { createProxyMiddleware } = require("http-proxy-middleware");

module.exports = function(app) {
  // Usar o nome do serviço Docker para acessar o backend
  app.use(
    "/api",
    createProxyMiddleware({
      target: "http://backend:5000", // Nome do serviço no docker-compose
      changeOrigin: true,
      logLevel: "debug",
      // Aumentar o timeout para 60 segundos
      timeout: 60000,
      // Tratar erros de proxy
      onError: (err, req, res) => {
        console.error('Erro de proxy:', err);
        res.writeHead(500, {
          'Content-Type': 'text/plain',
        });
        res.end('Erro ao conectar ao backend: ' + err.message);
      }
    })
  );
}; 