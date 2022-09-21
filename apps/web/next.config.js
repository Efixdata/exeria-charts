const withTM = require("next-transpile-modules")(["ui", "@dexer-io/react-chart", "@dexer-io/chart"]);

module.exports = withTM({
  reactStrictMode: true,
});
