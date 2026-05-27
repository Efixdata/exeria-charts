const path = require("path");
const fs = require("fs");

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
    "@efixdata/exeria-chart$": chartEntry,
    "@efixdata/exeria-chart": chartEntry,
    "@efixdata/exeria-chart-ui-react$": chartUiEntry,
    "@efixdata/exeria-chart-ui-react": chartUiEntry,
    ui: uiRoot,
  };

  return {
    name: "chart-ui-monorepo-plugin",
    configureWebpack(config) {
      const existingAlias = config.resolve?.alias ?? {};

      return {
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
