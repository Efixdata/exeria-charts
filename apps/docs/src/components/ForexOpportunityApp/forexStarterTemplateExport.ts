import { createZipBlob, downloadBlob } from "../CryptoTerminalApp/createZipArchive";
import eurUsdM15 from "./data/eur-usd-m15.json";
import { buildForexStarterCode } from "./forexOpportunityStarterCode";

function buildPackageJson(): string {
  return JSON.stringify(
    {
      name: "exeria-fx-radar",
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
  return `# Exeria FX Opportunity Radar Starter

Generated from https://exeria.dev/starters/forex-platforms

## Run it (3 commands)

\`\`\`bash
npm install
npm run dev
\`\`\`

Open the URL in your terminal (usually http://localhost:5173).

Default pair: **EUR/USD** — candles load from \`public/data/eur-usd-m15.json\` (bundled fixture, no API keys).

## What to edit first

- \`src/App.tsx\` — main chart screen (start here)
- \`snippets/\` — strategies, news-on-chart, opportunity feed, backend wiring

## What's included vs what you add

- **Included:** chart, toolbar (ChartUI), static FX candles, starter patterns for news + opportunities
- **Demo:** opportunity list and macro copy are yours to replace with real APIs
- **You add:** live data connector (e.g. Kraken), scorer service, alerts

Docs: https://exeria.dev/starters/forex-platforms
`;
}

export function buildForexStarterZipEntries() {
  const snippets = buildForexStarterCode();

  return [
    { path: "package.json", content: buildPackageJson() },
    {
      path: "index.html",
      content: `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Exeria FX Opportunity Radar</title>
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
            target: "ES2020",
            useDefineForClassFields: true,
            lib: ["ES2020", "DOM", "DOM.Iterable"],
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
    {
      path: "src/styles.css",
      content: `html, body, #root {
  margin: 0;
  width: 100%;
  height: 100%;
  background: #f0f3fa;
}
`,
    },
    {
      path: "public/data/eur-usd-m15.json",
      content: JSON.stringify(eurUsdM15, null, 2),
    },
    { path: "snippets/minimal-chart.tsx", content: snippets.chartOnly },
    { path: "snippets/radar-shell.tsx", content: snippets.opportunityShell },
    { path: "snippets/strategies.ts", content: snippets.strategies },
    { path: "snippets/news-on-chart.ts", content: snippets.publishNews },
    { path: "snippets/opportunity-feed.tsx", content: snippets.opportunityFeed },
    { path: "snippets/wire-backend.ts", content: snippets.wireBackend },
    { path: "snippets/layout.txt", content: snippets.integrationMap },
    { path: "README.md", content: buildReadme() },
  ];
}

export function downloadForexStarterZip() {
  const blob = createZipBlob(buildForexStarterZipEntries());
  downloadBlob(blob, "exeria-fx-radar-starter.zip");
}
