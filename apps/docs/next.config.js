const withTM = require("next-transpile-modules")(["@dexer-io/chart"]);

module.exports = withTM({
  reactStrictMode: true,
});
