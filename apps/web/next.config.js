const withTM = require("next-transpile-modules")(["ui", "@dexer-io/react-chart-ui", "@dexer-io/chart"]);

module.exports = withTM({
  reactStrictMode: true,
});
