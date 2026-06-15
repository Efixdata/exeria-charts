import type { ForexTimeframeId } from "../ForexOpportunityApp/forexInstruments";

export const MARKET_NEWS_BRAND = "Market Pulse";
export const MARKET_NEWS_TIMEFRAME_ID: ForexTimeframeId = "h1";

export type MarketNewsPeriodId = "1w" | "1m" | "3m";

export const MARKET_NEWS_PERIODS: Array<{
  id: MarketNewsPeriodId;
  label: string;
  bars: number;
}> = [
  { id: "1w", label: "1W", bars: 168 },
  { id: "1m", label: "1M", bars: 720 },
  { id: "3m", label: "3M", bars: 1000 },
];

/** Bar counts for the compare chart (top embed) period pills only. */
export const COMPARE_CHART_PERIOD_BARS: Record<MarketNewsPeriodId, number> = {
  "1w": 80,
  "1m": 200,
  "3m": 400,
};

export const COMPARE_PRIMARY_SYMBOL = "EUR/USD";
export const COMPARE_OVERLAY_SYMBOL = "GBP/USD";

export const COMPARE_COLORS = {
  primary: "#2563eb",
  overlay: "#d97706",
} as const;

export const SIDEBAR_PAIRS = ["EUR/USD", "GBP/USD", "USD/JPY", "USD/CHF", "EUR/GBP"] as const;

export const FOREX_MINI_CHART_BARS = 96;

export const SIDEBAR_PAIR_COLORS: Record<(typeof SIDEBAR_PAIRS)[number], string> = {
  "EUR/USD": "#2962ff",
  "GBP/USD": "#7c3aed",
  "USD/JPY": "#0d9488",
  "USD/CHF": "#d97706",
  "EUR/GBP": "#db2777",
};

export function getSidebarPairColor(symbol: string): string {
  return SIDEBAR_PAIR_COLORS[symbol as (typeof SIDEBAR_PAIRS)[number]] ?? "#2962ff";
}
