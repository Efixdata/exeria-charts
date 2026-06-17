import { createZipBlob, downloadBlob } from "../CryptoTerminalApp/createZipArchive";
import eurUsdH1 from "../ForexOpportunityApp/data/eur-usd-h1.json";
import { buildQuantStarterCode } from "./quantStarterCode";

function buildPackageJson(): string {
  return JSON.stringify(
    {
      name: "exeria-quant-analytics",
      private: true,
      version: "0.1.0",
      type: "module",
      scripts: {
        dev: "vite",
        build: "tsc -b && vite build",
        preview: "vite preview",
      },
      dependencies: {
        "@efixdata/exeria-chart": "^1.3.1",
        "@efixdata/exeria-chart-ui-react": "^1.2.0",
        react: "^18.3.1",
        "react-dom": "^18.3.1",
      },
      devDependencies: {
        "@types/react": "^18.3.3",
        "@types/react-dom": "^18.3.0",
        "@vitejs/plugin-react": "^4.3.1",
        typescript: "^5.6.3",
        vite: "^5.4.8",
      },
    },
    null,
    2,
  );
}

function buildReadme(): string {
  return `# Exeria Quant Analytics Starter

Generated from https://exeria.dev/starters/quant-analytics

## Run it (3 commands)

\`\`\`bash
npm install
npm run dev
\`\`\`

Open the URL in your terminal (usually http://localhost:5173).

Default pair: **EUR/USD H1** — candles load from \`public/data/eur-usd-h1.json\` (bundled fixture, no API keys).

## What to edit first

- \`src/App.tsx\` — main dashboard screen (start here)
- \`src/mountQuantDashboard.ts\` — strategy wiring (WMA/EMA composite + equity curve)
- \`snippets/\` — other presets, equity curve, and wiring helpers

## What's included vs what you add

- **Included:** chart, toolbar (ChartUI), static FX candles, WMA/EMA composite preset, equity pane
- **Demo:** strategy presets are educational backtests — not investment advice
- **You add:** your data feed, custom indicators, and production risk rules

Docs: https://exeria.dev/starters/quant-analytics
`;
}

export function buildQuantStarterZipEntries() {
  const snippets = buildQuantStarterCode();

  return [
    { path: "package.json", content: buildPackageJson() },
    {
      path: "index.html",
      content: `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Exeria Quant Analytics</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
`,
    },
    {
      path: "vite.config.ts",
      content: `import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
});
`,
    },
    {
      path: "tsconfig.json",
      content: JSON.stringify(
        {
          compilerOptions: {
            target: "ES2022",
            useDefineForClassFields: true,
            lib: ["ES2022", "DOM", "DOM.Iterable"],
            module: "ESNext",
            skipLibCheck: true,
            moduleResolution: "bundler",
            allowImportingTsExtensions: true,
            resolveJsonModule: true,
            isolatedModules: true,
            noEmit: true,
            jsx: "react-jsx",
            strict: true,
          },
          include: ["src"],
        },
        null,
        2,
      ),
    },
    {
      path: "src/main.tsx",
      content: `import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./styles.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
`,
    },
    { path: "src/App.tsx", content: snippets.chartUi },
    { path: "src/mountQuantDashboard.ts", content: snippets.wmaEmaComposite },
    {
      path: "src/styles.css",
      content: `html, body, #root {
  margin: 0;
  width: 100%;
  height: 100%;
  background: #0b1220;
}
`,
    },
    {
      path: "public/data/eur-usd-h1.json",
      content: JSON.stringify(eurUsdH1, null, 2),
    },
    { path: "snippets/minimal-chart.tsx", content: snippets.chartOnly },
    { path: "snippets/dashboard-shell.tsx", content: snippets.quantShell },
    { path: "snippets/wma-ema-composite.ts", content: snippets.wmaEmaComposite },
    { path: "snippets/bollinger-breakout.ts", content: snippets.bollingerBreakout },
    { path: "snippets/mean-reversion.ts", content: snippets.meanReversion },
    { path: "snippets/equity-curve.ts", content: snippets.equityCurve },
    { path: "snippets/programmatic-wiring.ts", content: snippets.programmaticWiring },
    { path: "snippets/layout.txt", content: snippets.integrationMap },
    { path: "README.md", content: buildReadme() },
  ];
}

export function downloadQuantStarterZip() {
  const blob = createZipBlob(buildQuantStarterZipEntries());
  downloadBlob(blob, "exeria-quant-analytics-starter.zip");
}
