const path = require("path");

const pluginSearchByWorker = path.resolve(
  __dirname,
  "node_modules/@easyops-cn/docusaurus-search-local/dist/client/client/theme/searchByWorker.js",
);

/** Enables local search in `docusaurus start` (upstream only runs in production builds). */
module.exports = function searchDevPlugin() {
  return {
    name: "search-dev-plugin",
    configureWebpack() {
      if (process.env.NODE_ENV === "production") {
        return {};
      }

      return {
        resolve: {
          alias: {
            [pluginSearchByWorker]: path.resolve(__dirname, "src/search/searchByWorker.ts"),
          },
        },
      };
    },
  };
};
