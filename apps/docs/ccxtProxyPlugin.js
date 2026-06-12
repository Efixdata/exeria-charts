const { registerCcxtRoutes } = require("./server/ccxtProxy.cjs");

/**
 * Exposes /api/ccxt/* during `docusaurus start` so CCXT demo pages can load
 * exchange data without bundling CCXT in the browser.
 */
module.exports = function ccxtProxyPlugin() {
  return {
    name: "ccxt-proxy-plugin",
    configureWebpack(_config, isServer) {
      if (isServer || process.env.NODE_ENV !== "development") {
        return {};
      }

      return {
        devServer: {
          setupMiddlewares: (middlewares, devServer) => {
            if (devServer?.app) {
              registerCcxtRoutes(devServer.app);
            }

            return middlewares;
          },
        },
      };
    },
  };
};
