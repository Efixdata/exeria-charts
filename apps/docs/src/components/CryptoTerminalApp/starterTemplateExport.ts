import type { TimeframeId } from "./constants";
import { buildStarterCode } from "./cryptoTerminalStarterCode";
import { createZipBlob, downloadBlob } from "./createZipArchive";
function buildPackageJson(): string {
  return JSON.stringify(
    {
      name: "exeria-crypto-terminal",
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
  return `# Exeria Crypto Terminal Starter

Generated from https://exeria.dev/starters/crypto-terminal

## Run it (3 commands)

\`\`\`bash
npm install
npm run dev
\`\`\`

Open the URL in your terminal (usually http://localhost:5173).

Default symbol: **${symbol}** — live Binance spot data, no API keys.

## What to edit first

- \`src/App.tsx\` — main chart screen (start here)
- \`snippets/\` — extra copy-paste examples (data, orders, layout)

## What's live vs demo

- **Live:** chart, prices (Binance public API)
- **Demo:** orders and positions (browser only — not a real exchange)

## When you're ready for production

- Replace simulated orders with your broker API
- See the "Trade from chart" tutorial on the docs site

Docs: https://exeria.dev/docs/getting-started/vite-react
`;
}

export function buildStarterZipEntries(symbol: string, timeframeId: TimeframeId) {
  const snippets = buildStarterCode(symbol, timeframeId);

  return [
    { path: "package.json", content: buildPackageJson() },
    { path: "index.html", content: `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Exeria Crypto Terminal</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
` },
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
  background: #0b0e14;
}
`,
    },
    { path: "snippets/chart-setup.ts", content: snippets.chart },
    { path: "snippets/data-connector.ts", content: snippets.data },
    { path: "snippets/trade-hooks.ts", content: snippets.trade },
    { path: "snippets/layout.txt", content: snippets.layout },
    { path: "README.md", content: buildReadme(symbol) },
  ];
}

export function downloadStarterZip(symbol: string, timeframeId: TimeframeId) {
  const blob = createZipBlob(buildStarterZipEntries(symbol, timeframeId));
  downloadBlob(blob, "exeria-crypto-terminal-starter.zip");
}
