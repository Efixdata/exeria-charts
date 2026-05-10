const path = require("path");

const distPath = path.resolve(__dirname, "dist");
const tsConfigPath = path.resolve(__dirname, "tsconfig.json");

const baseConfig = {
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        exclude: /node_modules/,
        use: {
          loader: "ts-loader",
          options: {
            configFile: tsConfigPath,
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
};

module.exports = (_env, argv = {}) => {
  const isProd = argv.mode === "production";

  return [
    {
      ...baseConfig,
      name: "umd",
      mode: isProd ? "production" : "development",
      entry: "./src/Chart.ts",
      output: {
        filename: "index.js",
        path: distPath,
        clean: true,
        library: {
          type: "umd",
        },
        globalObject: "this",
      },
      optimization: {
        minimize: isProd,
      },
    },
    {
      ...baseConfig,
      name: "esm",
      mode: isProd ? "production" : "development",
      entry: "./src/index.ts",
      experiments: {
        outputModule: true,
      },
      output: {
        filename: "index.mjs",
        path: distPath,
        module: true,
        library: {
          type: "module",
        },
      },
      optimization: {
        minimize: isProd,
      },
    },
  ];
};
