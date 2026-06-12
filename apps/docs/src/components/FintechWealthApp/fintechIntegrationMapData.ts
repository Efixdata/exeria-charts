export const FINTECH_LAYOUT_TREE = `FintechWealthApp/
├── index.tsx                    # Shell, market toggle, portfolio hero
├── FintechCompareChart.tsx      # Multi-asset % compare chart
├── fintechCompareChartSetup.ts  # Overlays, focus, chart chrome
├── portfolioModel.ts            # Cash + positions × price
├── equityDataLoader.ts          # Static CSV fixtures (equities)
├── marketPresets.ts             # Crypto vs equities asset lists
├── AllocationRing.tsx           # Live allocation donut
├── InsightStrip.tsx             # Top mover, savings goal cards
├── WatchlistStrip.tsx           # Radar list + sparklines
├── HoldingCard.tsx              # Holdings with mini charts
├── AssetDetailSheet.tsx         # Bottom sheet + single-asset chart
├── FintechSingleAssetChart.tsx  # Price chart in detail view
└── useWatchlistSparklines.ts    # Sparkline data per market`;

export const STACKBLITZ_STARTER_URL =
  "https://stackblitz.com/fork/vitejs/vite/tree/main/packages/create-vite/template-react-ts";

export const GITHUB_VITE_REACT_TEMPLATE_URL =
  "https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts";
