const path = require("path");
const fs = require("fs");

function isBenignResizeObserverError(message) {
  if (!message) {
    return false;
  }

  return (
    message.includes("ResizeObserver loop completed with undelivered notifications.") ||
    message.includes("ResizeObserver loop limit exceeded")
  );
}

/**
 * Bundle Chart UI from monorepo sources instead of the prebuilt UMD dist.
 * The dist bundle does not expose named exports correctly to Docusaurus/webpack.
 */
module.exports = function chartUiMonorepoPlugin() {
  const repoRoot = path.resolve(__dirname, "../..");
  const chartRoot = path.join(repoRoot, "packages/chart");
  const chartUiRoot = path.join(repoRoot, "packages/react-chart-ui");
  const uiRoot = path.join(repoRoot, "packages/ui");
  const chartEntry = path.join(chartRoot, "src/index.ts");
  const chartUiEntry = path.join(chartUiRoot, "index.tsx");
  const transpileInclude = [chartRoot, chartUiRoot, uiRoot];

  const aliases = {
    "@exeria/charts$": chartEntry,
    "@exeria/charts": chartEntry,
    "@exeria/charts-ui$": chartUiEntry,
    "@exeria/charts-ui": chartUiEntry,
    ui: uiRoot,
  };

  return {
    name: "chart-ui-monorepo-plugin",
    configureWebpack(config, isServer) {
      const existingAlias = config.resolve?.alias ?? {};

      const webpackConfig = {
        mergeStrategy: {
          "resolve.alias": "merge",
        },
        resolve: {
          alias: {
            ...(typeof existingAlias === "object" && !Array.isArray(existingAlias)
              ? existingAlias
              : {}),
            ...aliases,
          },
        },
        module: {
          rules: [
            {
              test: /\.[jt]sx?$/,
              include: transpileInclude,
              use: {
                loader: require.resolve("babel-loader"),
                options: {
                  presets: [require.resolve("@docusaurus/core/lib/babel/preset")],
                },
              },
            },
          ],
        },
      };

      if (!isServer && process.env.NODE_ENV === "development") {
        webpackConfig.devServer = {
          client: {
            overlay: {
              runtimeErrors: (error) => !isBenignResizeObserverError(error?.message),
            },
          },
        };
      }

      return webpackConfig;
    },
  };
};

// Fail fast with a clear message if monorepo sources are missing.
const chartEntry = path.join(
  path.resolve(__dirname, "../.."),
  "packages/chart/src/index.ts",
);
if (!fs.existsSync(chartEntry)) {
  throw new Error(
    `chart-ui-monorepo-plugin: chart entry not found at ${chartEntry}. ` +
      "Run npm install from the repository root.",
  );
}
