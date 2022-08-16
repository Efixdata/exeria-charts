const path = require("path");

module.exports = {
  entry: "./src/index.js",
  output: {
    filename: "main.js",
    path: path.resolve(__dirname, "dist"),
    libraryTarget: "var",
    library: "Chart",
  },
  optimization: {
    minimize: false
},
};