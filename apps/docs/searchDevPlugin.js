const path = require("path");

const pluginSearchByWorker = path.resolve(
  __dirname,
  "node_modules/@easyops-cn/docusaurus-search-local/dist/client/client/theme/searchByWorker.js",
);

/** Enables local search in `docusaurus start` (upstream only runs in production builds). */
module.exports = function searchDevPlugin() {
  return {
    name: "search-dev-plugin",
    configureWebpack(config) {
      if (process.env.NODE_ENV === "production") {
        return {};
      }

      const existingAlias =
        typeof config?.resolve?.alias === "object" && !Array.isArray(config.resolve.alias)
          ? config.resolve.alias
          : {};

      return {
        resolve: {
          alias: {
            ...existingAlias,
            [pluginSearchByWorker]: path.resolve(__dirname, "src/search/searchByWorker.ts"),
          },
        },
      };
    },
  };
};
