const { registerCoinbaseRoutes } = require("./server/coinbaseProxy.cjs");

/**
 * Exposes /api/coinbase/* during `docusaurus start` so Coinbase demo pages
 * can load market data without browser CORS blocking direct API calls.
 */
module.exports = function coinbaseProxyPlugin() {
  return {
    name: "coinbase-proxy-plugin",
    configureWebpack(_config, isServer) {
      if (isServer || process.env.NODE_ENV !== "development") {
        return {};
      }

      return {
        devServer: {
          setupMiddlewares: (middlewares, devServer) => {
            if (devServer?.app) {
              registerCoinbaseRoutes(devServer.app);
            }

            return middlewares;
          },
        },
      };
    },
  };
};
