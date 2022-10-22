const path = require("path");

module.exports = {
  entry: "./src/Chart.js",
  module: {
    rules: [
      {
        test: /\.svg$/,
        loader: 'svg-inline-loader'
      }
    ],
  },
  output: {
    filename: "index.js",
    path: path.resolve(__dirname, "dist"),
    library: {
      type: 'umd'
    },
    // globalObject: 'this'
  },
  optimization: {
    minimize: true
},
};