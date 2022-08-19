const withTM = require("next-transpile-modules")(["ui", "@dexer-io/react-chart"]);

module.exports = withTM({
  reactStrictMode: true,
});
