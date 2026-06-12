import { createZipBlob, downloadBlob } from "../CryptoTerminalApp/createZipArchive";
import type { FintechPeriodId } from "./constants";
import { buildFintechStarterCode } from "./fintechStarterCode";
import type { FintechMarketId } from "./marketPresets";

const EQUITY_FIXTURE_SYMBOLS = ["AAPL", "VWCE", "SPY"] as const;

function buildPackageJson(): string {
  return JSON.stringify(
    {
      name: "exeria-fintech-wealth",
      private: true,
      version: "0.1.0",
      type: "module",
      scripts: {
        dev: "vite",
        build: "tsc -b && vite build",
        preview: "vite preview",
      },
      dependencies: {
        "@exeria/charts": "^1.0.0",
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

function buildReadme(marketId: FintechMarketId): string {
  return `# Exeria Fintech Wealth Starter

Generated from https://exeria.dev/starters/fintech-integration

## Run it (3 commands)

\`\`\`bash
npm install
npm run dev
\`\`\`

Open the URL in your terminal (usually http://localhost:5173).

Default market: **${marketId}** — equities load from \`public/data/fintech-equity/*.csv\`.

## What to edit first

- \`src/App.tsx\` — compare chart + wealth shell (start here)
- \`src/equityDataLoader.ts\` — CSV parsing and period slicing
- \`snippets/\` — chart setup, portfolio model, layout map

## What's included vs what you add

- **Included:** compare chart, portfolio header pattern, equity CSV fixtures
- **You add:** your data connector, auth, real positions from your backend

Docs: https://docs.exeria.charts/getting-started/nextjs-app-router
`;
}

async function fetchEquityFixture(symbol: string): Promise<string | null> {
  try {
    const response = await fetch(`/data/fintech-equity/${symbol}.csv`);
    if (!response.ok) {
      return null;
    }

    return response.text();
  } catch {
    return null;
  }
}

export async function buildFintechStarterZipEntries(
  periodId: FintechPeriodId,
  marketId: FintechMarketId,
) {
  const snippets = buildFintechStarterCode(periodId, marketId);
  const equityFiles = await Promise.all(
    EQUITY_FIXTURE_SYMBOLS.map(async (symbol) => {
      const content = await fetchEquityFixture(symbol);
      return content ? { path: `public/data/fintech-equity/${symbol}.csv`, content } : null;
    }),
  );

  return [
    { path: "package.json", content: buildPackageJson() },
    {
      path: "index.html",
      content: `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Exeria Fintech Wealth</title>
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
    { path: "src/App.tsx", content: snippets.compareChart },
    { path: "src/equityDataLoader.ts", content: snippets.equityData },
    {
      path: "src/styles.css",
      content: `html, body, #root {
  margin: 0;
  width: 100%;
  min-height: 100%;
  background: #000000;
  color: #f5f7fb;
  font-family: Inter, system-ui, sans-serif;
}
`,
    },
    { path: "snippets/wealth-shell.tsx", content: snippets.wealthShell },
    { path: "snippets/full-app.tsx", content: snippets.fullApp },
    { path: "snippets/chart-setup.ts", content: snippets.chartSetup },
    { path: "snippets/portfolio-model.ts", content: snippets.portfolio },
    { path: "snippets/layout.txt", content: snippets.layout },
    { path: "README.md", content: buildReadme(marketId) },
    ...equityFiles.filter((entry): entry is { path: string; content: string } => entry != null),
  ];
}

export async function downloadFintechStarterZip(
  periodId: FintechPeriodId,
  marketId: FintechMarketId,
) {
  const entries = await buildFintechStarterZipEntries(periodId, marketId);
  const blob = createZipBlob(entries);
  downloadBlob(blob, "exeria-fintech-wealth-starter.zip");
}
