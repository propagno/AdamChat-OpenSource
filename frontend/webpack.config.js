// webpack.config.js
module.exports = {
    module: {
      rules: [
        {
          test: /\.js$/,
          enforce: 'pre',
          use: ['source-map-loader'],
          exclude: [
            // Pacotes que podem causar problemas com source maps
          ],
        },
      ],
    },
    ignoreWarnings: [
      // Avisos que podem ser ignorados
    ],
  };
  