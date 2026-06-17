export type IntegrationStatus = "live" | "simulated" | "your-api";

export type IntegrationMapItem = {
  id: string;
  label: string;
  status: IntegrationStatus;
  component: string;
  module: string;
  docsHref: string;
  docsLabel: string;
};

export const INTEGRATION_MAP_ITEMS: IntegrationMapItem[] = [
  {
    id: "watchlist",
    label: "Markets",
    status: "live",
    component: "WatchlistPanel",
    module: "useWatchlistStats.ts",
    docsHref: "/docs/data-connectors/binance",
    docsLabel: "Binance connector",
  },
  {
    id: "chart",
    label: "Chart",
    status: "live",
    component: "CryptoTerminalChartHost",
    module: "@efixdata/exeria-chart + ChartUI",
    docsHref: "/docs/getting-started/react",
    docsLabel: "React quickstart",
  },
  {
    id: "depth",
    label: "Depth",
    status: "live",
    component: "OrderBookPanel",
    module: "useBinanceMarketStreams.ts",
    docsHref: "/docs/tutorials/live-data-stream",
    docsLabel: "Live data stream",
  },
  {
    id: "tape",
    label: "Tape",
    status: "live",
    component: "TradesTape",
    module: "useBinanceMarketStreams.ts",
    docsHref: "/docs/chart-usage/realtime-updates",
    docsLabel: "Realtime updates",
  },
  {
    id: "trade",
    label: "Trade ticket",
    status: "your-api",
    component: "RightDock",
    module: "resolveChartClickPrice.ts",
    docsHref: "/docs/tutorials/trade-from-chart",
    docsLabel: "Trade from chart",
  },
  {
    id: "orders",
    label: "Orders",
    status: "simulated",
    component: "OrdersPanel",
    module: "chartTradeModel.ts",
    docsHref: "/docs/tutorials/trade-from-chart",
    docsLabel: "Broker wiring",
  },
  {
    id: "holdings",
    label: "Positions",
    status: "simulated",
    component: "OpenPositionsPanel",
    module: "useChartTradeSync.ts",
    docsHref: "/docs/tutorials/trade-from-chart",
    docsLabel: "Trade from chart",
  },
];

export const LAYOUT_TREE = `CryptoTerminalApp/
├── index.tsx                 # Shell, state, keyboard shortcuts
├── CryptoTerminalChartHost   # Chart + Binance adapter (isolated re-renders)
├── WatchlistPanel            # Markets sidebar
├── RightDock                 # Trade | Depth | Tape | Orders | Positions
│   ├── OrderBookPanel
│   ├── TradesTape
│   ├── OrdersPanel
│   └── OpenPositionsPanel
├── StatsRibbon / MarketTicker
├── CommandPalette / CodeDrawer
├── useBinanceMarketStreams.ts # depth10@100ms + aggTrade WS
├── useSparklineSeries.ts     # 24×1h klines REST sparklines
├── chartTradeModel.ts        # model.orders / model.positions sync
├── useChartTradeSync.ts      # Broker callbacks + simulated fills
├── positionPnl.ts            # Unrealized PnL on open positions
├── workspacePresets.ts       # Trader / Chart focus / Scalper layouts
├── MultiChartGrid.tsx        # Side-by-side symbol compare
├── priceAlerts.ts            # Alert lines + crossing detection
├── starterTemplateExport.ts  # ZIP + GitHub template export
├── useWatchlistStats.ts      # Binance 24h ticker REST
├── LatencyPanel.tsx          # Depth / tape / ticker latency
└── resolveChartClickPrice.ts # Click chart → order price`;

export const STACKBLITZ_STARTER_URL =
  "https://stackblitz.com/github/vitejs/vite/tree/main/packages/create-vite/template-react-ts";

export const GITHUB_VITE_REACT_TEMPLATE_URL =
  "https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts";
