/**
 * Generates API reference MDX partials from TypeScript sources (TypeDoc-style tables).
 */
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  createApiDocProgram,
  getExportDocumentation,
  getInterfaceDocumentation,
  renderGeneratedApiMdx,
  writeGeneratedMdx,
} from "./lib/typescript-api-doc.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const docsRoot = path.resolve(__dirname, "..");
const repoRoot = path.resolve(docsRoot, "../..");
const configPath = path.resolve(docsRoot, "tsconfig.api-doc.json");

const generatedAt = new Date().toISOString().slice(0, 10);

function main() {
  const program = createApiDocProgram(configPath);

  const chartInstance = getInterfaceDocumentation(
    program,
    path.join(repoRoot, "packages/chart/src/types.ts"),
    "ChartInstance",
  );

  writeGeneratedMdx(
    path.join(docsRoot, "docs/api-reference/_generated/chart-instance-api.mdx"),
    renderGeneratedApiMdx({
      packageLabel: "@efixdata/exeria-chart",
      sourceLabel: "ChartInstance in packages/chart/src/types.ts",
      generatedAt,
      exports: [chartInstance],
      intro:
        `This table is generated from \`ChartInstance\` in \`packages/chart/src/types.ts\` on **${generatedAt}**. Use the curated sections above for task-oriented guidance; use this table when you need the complete contract.`,
    }),
  );

  const chartUiExports = getExportDocumentation(
    program,
    path.join(repoRoot, "packages/react-chart-ui/index.tsx"),
  );

  writeGeneratedMdx(
    path.join(docsRoot, "docs/api-reference/_generated/chart-ui-api.mdx"),
    renderGeneratedApiMdx({
      packageLabel: "@efixdata/exeria-chart-ui-react",
      sourceLabel: "packages/react-chart-ui/index.tsx",
      generatedAt,
      exports: chartUiExports,
      intro:
        `This reference is generated from the public exports of \`@efixdata/exeria-chart-ui-react\` (\`packages/react-chart-ui/index.tsx\`) on **${generatedAt}**. Curated sections above cover layout and theming; use this for exact props, hooks, and utility signatures.`,
    }),
  );

  const chartEnvironmentPath = path.join(repoRoot, "packages/chart/src/utils/chartEnvironment.ts");
  const chartEnvironmentExports = [
    getInterfaceDocumentation(program, chartEnvironmentPath, "ChartEnvironmentSnapshot"),
    ...getExportDocumentation(program, chartEnvironmentPath).filter((item) =>
      ["ChartLayoutMode", "ChartLayoutModeOverride"].includes(item.name),
    ),
    getInterfaceDocumentation(program, chartEnvironmentPath, "ChartEnvironmentOptions"),
  ];

  writeGeneratedMdx(
    path.join(docsRoot, "docs/api-reference/_generated/chart-environment-api.mdx"),
    renderGeneratedApiMdx({
      packageLabel: "@efixdata/exeria-chart",
      sourceLabel: "packages/chart/src/utils/chartEnvironment.ts",
      generatedAt,
      exports: chartEnvironmentExports,
      intro:
        `This reference is generated from \`packages/chart/src/utils/chartEnvironment.ts\` on **${generatedAt}**. It is the shape returned by \`chart.getChartEnvironment()\`, \`useChartEnvironment()\`, and the \`ENVIRONMENT_CHANGE\` event.`,
    }),
  );

  console.log(
    `[generate-api-reference] ChartInstance: ${chartInstance.members.length} members; ChartUI: ${chartUiExports.length} exports; Chart environment: ${chartEnvironmentExports.length} types`,
  );
}

main();
