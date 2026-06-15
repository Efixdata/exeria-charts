import eurUsdH1 from "../ForexOpportunityApp/data/eur-usd-h1.json";
import eurUsdNews from "../ForexOpportunityApp/data/eur-usd-news-feed.json";
import gbpUsdH1 from "../ForexOpportunityApp/data/gbp-usd-h1.json";
import { createZipBlob, downloadBlob } from "../CryptoTerminalApp/createZipArchive";
import { buildMarketNewsStarterCode } from "./marketNewsStarterCode";

function buildPackageJson(): string {
  return JSON.stringify(
    {
      name: "exeria-market-news",
      private: true,
      version: "0.1.0",
      type: "module",
      scripts: {
        dev: "vite",
        build: "tsc -b && vite build",
        preview: "vite preview",
      },
      dependencies: {
        "@exeria/charts": "^1.3.0",
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
  return `# Exeria Market News Starter

Generated from https://exeria.dev/starters/market-news

## Run it (3 commands)

\`\`\`bash
npm install
npm run dev
\`\`\`

Open the URL in your terminal (usually http://localhost:5173).

## What to edit first

- \`src/App.tsx\` — article layout with compare + news charts (start here)
- \`src/data/*.json\` — swap for your CMS export or market API
- \`snippets/\` — smaller copy-paste examples (vanilla embed, compare, news)

## What's included

- **Static FX candles** — EUR/USD and GBP/USD H1 fixtures (no API keys)
- **News feed JSON** — sample headlines for NEWSFEED markers
- **No ChartUI** — lightweight \`createChart\` embeds for articles

## When you're ready for production

- Replace JSON files with your CMS or data pipeline
- See multi-instrument and news-feed docs on the Exeria site

Docs: https://docs.exeria.charts/getting-started/vanilla
`;
}

export function buildMarketNewsZipEntries() {
  const snippets = buildMarketNewsStarterCode();

  return [
    { path: "package.json", content: buildPackageJson() },
    {
      path: "index.html",
      content: `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Market News Article</title>
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
    { path: "src/App.tsx", content: snippets.articleApp },
    {
      path: "src/styles.css",
      content: `html, body, #root {
  margin: 0;
  width: 100%;
  min-height: 100%;
  background: #f7f4ef;
  color: #1c1917;
}
`,
    },
    {
      path: "src/data/eur-usd-h1.json",
      content: JSON.stringify(eurUsdH1, null, 2),
    },
    {
      path: "src/data/gbp-usd-h1.json",
      content: JSON.stringify(gbpUsdH1, null, 2),
    },
    {
      path: "src/data/eur-usd-news-feed.json",
      content: JSON.stringify(eurUsdNews, null, 2),
    },
    { path: "snippets/embed-chart.ts", content: snippets.embedChart },
    { path: "snippets/compare-pairs.ts", content: snippets.multiInstrument },
    { path: "snippets/news-feed.ts", content: snippets.newsFeed },
    { path: "snippets/article-shell.html", content: snippets.articleShell },
    { path: "README.md", content: buildReadme() },
  ];
}

export function downloadMarketNewsStarterZip() {
  const blob = createZipBlob(buildMarketNewsZipEntries());
  downloadBlob(blob, "exeria-market-news-starter.zip");
}
