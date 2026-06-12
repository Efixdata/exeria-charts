export type WatchlistSymbol = {
  id: string;
  label: string;
  pair: string;
};

export const WATCHLIST_SYMBOLS: WatchlistSymbol[] = [
  { id: "BTCUSDT", label: "BTC", pair: "BTC/USDT" },
  { id: "ETHUSDT", label: "ETH", pair: "ETH/USDT" },
  { id: "SOLUSDT", label: "SOL", pair: "SOL/USDT" },
  { id: "BNBUSDT", label: "BNB", pair: "BNB/USDT" },
  { id: "XRPUSDT", label: "XRP", pair: "XRP/USDT" },
  { id: "ADAUSDT", label: "ADA", pair: "ADA/USDT" },
];

export const TIMEFRAMES = [
  { id: "m15", label: "15m", interval: "15m" },
  { id: "hour", label: "1H", interval: "1h" },
  { id: "h4", label: "4H", interval: "4h" },
  { id: "day", label: "1D", interval: "1d" },
  { id: "week", label: "1W", interval: "1w" },
] as const;

export type TimeframeId = (typeof TIMEFRAMES)[number]["id"];

export type RightDockTab =
  | "trade"
  | "book"
  | "trades"
  | "alerts"
  | "orders"
  | "holdings";

export const RIGHT_DOCK_TABS: Array<{
  id: RightDockTab;
  label: string;
  simulated?: boolean;
}> = [
  { id: "trade", label: "Trade", simulated: true },
  { id: "book", label: "Depth" },
  { id: "trades", label: "Tape" },
  { id: "alerts", label: "Alerts" },
  { id: "orders", label: "Orders", simulated: true },
  { id: "holdings", label: "Positions", simulated: true },
];

export const STARTER_DISCLAIMER =
  "Starter workspace — live chart, depth, tape, and prices from Binance public API. Order execution is simulated.";

export const TICKER_HEADLINES = [
  "BTC holding above key VWAP as funding stays neutral",
  "ETH spot volume expanding into US session open",
  "SOL momentum watch: breakout retest on 4H structure",
  "Institutional flow monitors Binance perp basis spread",
  "Exeria Charts starter — wire your broker callbacks next",
] as const;

export const WORKSPACE_HINTS = [
  { key: "⌘K", label: "Jump to symbol" },
  { key: "F", label: "Focus chart" },
  { key: "1–6", label: "Watchlist hotkeys" },
  { key: "?", label: "Shortcuts" },
] as const;

export const WELCOME_DISMISS_KEY = "exeria-crypto-terminal-welcome-dismissed";
export const TOUR_DISMISS_KEY = "exeria-crypto-terminal-tour-dismissed";

export type WorkspaceMode = "builder" | "investor";
