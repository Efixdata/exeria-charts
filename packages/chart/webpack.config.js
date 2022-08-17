const path = require("path");

module.exports = {
  entry: "./src/Chart.js",
  output: {
    filename: "chart.js",
    path: path.resolve(__dirname, "dist"),
    library: {
      type: 'umd'
    },
    // globalObject: 'this'
  },
  optimization: {
    minimize: false
},
};