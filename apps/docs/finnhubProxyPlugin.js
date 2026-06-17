const { registerFinnhubRoutes } = require("./server/finnhubProxy.cjs");

/**
 * Exposes /api/finnhub/* during `docusaurus start` so Finnhub demo pages
 * can load market data without exposing API keys in the browser bundle.
 */
module.exports = function finnhubProxyPlugin() {
  return {
    name: "finnhub-proxy-plugin",
    configureWebpack(_config, isServer) {
      if (isServer || process.env.NODE_ENV !== "development") {
        return {};
      }

      return {
        devServer: {
          setupMiddlewares: (middlewares, devServer) => {
            if (devServer?.app) {
              registerFinnhubRoutes(devServer.app);
            }

            return middlewares;
          },
        },
      };
    },
  };
};
