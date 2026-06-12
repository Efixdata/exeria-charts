const { registerTwelveDataRoutes } = require("./server/twelveDataProxy.cjs");

/**
 * Exposes /api/twelve-data/* during `docusaurus start` so Twelve Data demo pages
 * can load market data without exposing API keys in the browser bundle.
 */
module.exports = function twelveDataProxyPlugin() {
  return {
    name: "twelve-data-proxy-plugin",
    configureWebpack(_config, isServer) {
      if (isServer || process.env.NODE_ENV !== "development") {
        return {};
      }

      return {
        devServer: {
          setupMiddlewares: (middlewares, devServer) => {
            if (devServer?.app) {
              registerTwelveDataRoutes(devServer.app);
            }

            return middlewares;
          },
        },
      };
    },
  };
};
