const withTM = require("next-transpile-modules")([
  "ui",
  "@efixdata/exeria-chart-ui-react",
  "@efixdata/exeria-chart",
]);

module.exports = withTM({
  reactStrictMode: true,
});
