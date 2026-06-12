const { registerCcxtRoutes } = require("./server/ccxtProxy.cjs");
const { registerTwelveDataRoutes } = require("./server/twelveDataProxy.cjs");
const { registerFinageRoutes } = require("./server/finageProxy.cjs");
const { registerFinnhubRoutes } = require("./server/finnhubProxy.cjs");
const { registerMassiveRoutes } = require("./server/massiveProxy.cjs");
const { registerCoinbaseRoutes } = require("./server/coinbaseProxy.cjs");
const { registerEodhdRoutes } = require("./server/eodhdProxy.cjs");
const { registerGateRoutes } = require("./server/gateProxy.cjs");

/**
 * Registers all docs API proxy routes during `docusaurus start`.
 * A single setupMiddlewares hook avoids webpack-dev-server merge issues where
 * individual connector plugins could fail to attach routes.
 */
module.exports = function apiProxyPlugin() {
  return {
    name: "api-proxy-plugin",
    configureWebpack(_config, isServer) {
      if (isServer || process.env.NODE_ENV !== "development") {
        return {};
      }

      return {
        devServer: {
          setupMiddlewares: (middlewares, devServer) => {
            if (devServer?.app) {
              registerCcxtRoutes(devServer.app);
              registerTwelveDataRoutes(devServer.app);
              registerFinageRoutes(devServer.app);
              registerFinnhubRoutes(devServer.app);
              registerMassiveRoutes(devServer.app);
              registerCoinbaseRoutes(devServer.app);
              registerEodhdRoutes(devServer.app);
              registerGateRoutes(devServer.app);
            }

            return middlewares;
          },
        },
      };
    },
  };
};
