const path = require("path");
 
const externals = {
  react: {
    root: "React",
    commonjs2: "react",
    commonjs: "react",
    amd: "react",
  },
  "react-dom": {
    root: "ReactDOM",
    commonjs2: "react-dom",
    commonjs: "react-dom",
    amd: "react-dom",
  },
};

const esmExternals = {
  react: "react",
  "react-dom": "react-dom",
};

const baseConfig = {
  entry: "./index.tsx",
  module: {
    rules: [
      {
        test: /\.(js|ts)x?$/,
        exclude: /node_modules/,
        use: {
          loader: "babel-loader",
          options: {
            presets: [
              "@babel/preset-env",
              ["@babel/preset-react", { runtime: "automatic" }],
              "@babel/preset-typescript",
            ],
          },
        },
      },
      {
        test: /\.(svg|png|jpe?g|gif)$/i,
        use: [
          {
            loader: "file-loader",
          },
        ],
      },
    ],
  },
  resolve: {
    extensions: [".tsx", ".jsx", ".ts", ".js"],
  },
  externals: [externals],
};

module.exports = (_env, argv = {}) => {
  const isProd = argv.mode === "production";

  return [
    {
      ...baseConfig,
      name: "umd",
      mode: isProd ? "production" : "development",
      output: {
        filename: "index.js",
        path: path.resolve(__dirname, "dist"),
        library: {
          name: "ReactChartUI",
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
      externalsType: "module",
      externals: [esmExternals],
      experiments: {
        outputModule: true,
      },
      output: {
        filename: "index.esm.js",
        path: path.resolve(__dirname, "dist"),
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
