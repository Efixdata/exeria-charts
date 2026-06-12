const { registerMassiveRoutes } = require("./server/massiveProxy.cjs");

/**
 * Exposes /api/massive/* during `docusaurus start` so Massive demo pages
 * can load market data without exposing API keys in the browser bundle.
 */
module.exports = function massiveProxyPlugin() {
  return {
    name: "massive-proxy-plugin",
    configureWebpack(_config, isServer) {
      if (isServer || process.env.NODE_ENV !== "development") {
        return {};
      }

      return {
        devServer: {
          setupMiddlewares: (middlewares, devServer) => {
            if (devServer?.app) {
              registerMassiveRoutes(devServer.app);
            }

            return middlewares;
          },
        },
      };
    },
  };
};
