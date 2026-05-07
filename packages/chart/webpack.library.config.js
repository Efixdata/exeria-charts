const path = require("path");

module.exports = {
  entry: "./src/Chart.ts",
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        exclude: /node_modules/,
        use: {
          loader: "ts-loader",
          options: {
            configFile: path.resolve(__dirname, "tsconfig.json"),
            transpileOnly: true,
          },
        },
      },
      {
        test: /\.svg$/,
        loader: "svg-inline-loader",
      },
    ],
  },
  resolve: {
    extensions: [".ts", ".tsx", ".js"],
  },
  output: {
    filename: "chart.js",
    path: path.resolve(__dirname, "dist"),
    library: {
      type: "umd",
    },
    globalObject: "this",
  },
  optimization: {
    minimize: false,
  },
};