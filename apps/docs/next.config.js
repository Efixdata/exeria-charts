const withTM = require("next-transpile-modules")(["@efixdata/exeria-chart"]);

module.exports = withTM({
  reactStrictMode: true,
});
