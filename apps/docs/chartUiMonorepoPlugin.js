const path = require("path");
const fs = require("fs");
const webpack = require("webpack");

function isBenignResizeObserverError(message) {
  if (!message) {
    return false;
  }

  return (
    message.includes("ResizeObserver loop completed with undelivered notifications.") ||
    message.includes("ResizeObserver loop limit exceeded")
  );
}

class EnforceMonorepoAliasesPlugin {
  constructor(aliases) {
    this.aliases = aliases;
  }

  apply(compiler) {
    compiler.hooks.afterEnvironment.tap("EnforceMonorepoAliasesPlugin", () => {
      const resolve = compiler.options.resolve ?? {};
      const existingAlias =
        typeof resolve.alias === "object" && !Array.isArray(resolve.alias) ? resolve.alias : {};

      resolve.alias = {
        ...existingAlias,
        ...this.aliases,
      };

      const baseConditions = Array.isArray(resolve.conditionNames)
        ? resolve.conditionNames
        : ["import", "require", "default"];

      resolve.conditionNames = [
        "development",
        ...baseConditions.filter((name) => name !== "development"),
      ];

      compiler.options.resolve = resolve;
    });
  }
}

/**
 * Bundle Chart UI from monorepo sources instead of the prebuilt UMD dist.
 * Register this plugin last in docusaurus.config.ts.
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
    "@efixdata/exeria-chart$": chartEntry,
    "@efixdata/exeria-chart": chartEntry,
    "@exeria/charts-ui$": chartUiEntry,
    "@exeria/charts-ui": chartUiEntry,
    "@efixdata/exeria-chart-ui-react$": chartUiEntry,
    "@efixdata/exeria-chart-ui-react": chartUiEntry,
    ui: uiRoot,
  };

  const moduleReplacements = [
    [/^@efixdata\/exeria-chart$/, chartEntry],
    [/^@exeria\/charts$/, chartEntry],
    [/^@efixdata\/exeria-chart-ui-react$/, chartUiEntry],
    [/^@exeria\/charts-ui$/, chartUiEntry],
  ];

  const babelRule = {
    test: /\.[jt]sx?$/,
    include: transpileInclude,
    use: {
      loader: require.resolve("babel-loader"),
      options: {
        presets: [require.resolve("@docusaurus/core/lib/babel/preset")],
      },
    },
  };

  return {
    name: "chart-ui-monorepo-plugin",
    configureWebpack(_config, isServer) {
      const webpackConfig = {
        mergeStrategy: {
          "resolve.alias": "merge",
          plugins: "append",
          "module.rules": "append",
        },
        resolve: {
          alias: aliases,
          conditionNames: ["development", "import", "require", "default"],
        },
        plugins: [
          new EnforceMonorepoAliasesPlugin(aliases),
          ...moduleReplacements.map(
            ([pattern, resource]) => new webpack.NormalModuleReplacementPlugin(pattern, resource),
          ),
        ],
        module: {
          rules: [babelRule],
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
