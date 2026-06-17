import type { TimeframeId } from "./constants";
import { buildSignalStarterCode } from "./signalTerminalStarterCode";
import { createZipBlob, downloadBlob } from "../CryptoTerminalApp/createZipArchive";

function buildPackageJson(): string {
  return JSON.stringify(
    {
      name: "exeria-screener-signals",
      private: true,
      version: "0.1.0",
      type: "module",
      scripts: {
        dev: "vite",
        build: "tsc -b && vite build",
        preview: "vite preview",
      },
      dependencies: {
        "@efixdata/connector-binance": "^1.0.0",
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

function buildReadme(symbol: string): string {
  return `# Exeria Screener Signals Starter

Generated from https://exeria.dev/starters/screener-signals

## Run it (3 commands)

\`\`\`bash
npm install
npm run dev
\`\`\`

Open the URL in your terminal (usually http://localhost:5173).

Default symbol: **${symbol}** — live Binance spot data, no API keys.

## What to edit first

- \`src/App.tsx\` — chart + ChartUI with built-in strategy markers (start here)
- \`snippets/\` — smaller copy-paste examples (chart-only, signal feed panel)

## What's live vs demo

- **Live:** chart, candles, MACD/CROSS/BBAND/EXCEED markers (Binance public API)
- **Demo:** screener list, filters, and alert settings from the docs site — wire your backend next

## When you're ready for production

- Replace mock signal rows with your screener or alert API
- See key strategies and live data stream docs on the Exeria site

Docs: https://exeria.dev/starters/screener-signals
`;
}

export function buildSignalStarterZipEntries(symbol: string, timeframeId: TimeframeId) {
  const snippets = buildSignalStarterCode(symbol, timeframeId);

  return [
    { path: "package.json", content: buildPackageJson() },
    {
      path: "index.html",
      content: `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Exeria Screener Signals</title>
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
  background: #0b0c10;
}
`,
    },
    { path: "snippets/chart-signals.tsx", content: snippets.chartSignals },
    { path: "snippets/signal-feed.tsx", content: snippets.signalFeed },
    { path: "README.md", content: buildReadme(symbol) },
  ];
}

export function downloadSignalStarterZip(symbol: string, timeframeId: TimeframeId) {
  const blob = createZipBlob(buildSignalStarterZipEntries(symbol, timeframeId));
  downloadBlob(blob, "exeria-screener-signals-starter.zip");
}
