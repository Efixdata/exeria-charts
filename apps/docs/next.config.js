const withTM = require("next-transpile-modules")(["ui", "react-chart"]);

module.exports = withTM({
  reactStrictMode: true,
});
