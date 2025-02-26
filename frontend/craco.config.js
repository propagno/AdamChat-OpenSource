// craco.config.js
module.exports = {
    webpack: {
      configure: (webpackConfig) => {
        webpackConfig.module.rules.push({
          test: /\.js$/,
          enforce: 'pre',
          use: ['source-map-loader'],
          exclude: [
            /node_modules\/@react-keycloak\/core/,
            /node_modules\/@react-keycloak\/web/,
          ],
        });
        return webpackConfig;
      },
    },
  };
  