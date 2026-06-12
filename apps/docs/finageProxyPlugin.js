const { registerFinageRoutes } = require("./server/finageProxy.cjs");

/**
 * Exposes /api/finage/* during `docusaurus start` so Finage demo pages
 * can load market data without exposing API keys in the browser bundle.
 */
module.exports = function finageProxyPlugin() {
  return {
    name: "finage-proxy-plugin",
    configureWebpack(_config, isServer) {
      if (isServer || process.env.NODE_ENV !== "development") {
        return {};
      }

      return {
        devServer: {
          setupMiddlewares: (middlewares, devServer) => {
            if (devServer?.app) {
              registerFinageRoutes(devServer.app);
            }

            return middlewares;
          },
        },
      };
    },
  };
};
