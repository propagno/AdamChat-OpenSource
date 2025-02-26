// webpack.config.js
module.exports = {
    module: {
      rules: [
        {
          test: /\.js$/,
          enforce: 'pre',
          use: ['source-map-loader'],
          exclude: [
            /node_modules\/@react-keycloak\/core/,
            /node_modules\/@react-keycloak\/web/,
          ],
        },
      ],
    },
    ignoreWarnings: [
      {
        module: /@react-keycloak\/core/,
      },
      {
        module: /@react-keycloak\/web/,
      },
    ],
  };
  