import type { TimeframeId } from "../CryptoTerminalApp/constants";

export { TIMEFRAMES, WATCHLIST_SYMBOLS, type TimeframeId } from "../CryptoTerminalApp/constants";

/** Chart settings + theme preset for screener charts (Carbon). */
export const SCREENER_CHART_PRESET_ID = "carbon";

export const SCREENER_SIGNAL_BUY_COLOR = "#2E7D52";
export const SCREENER_SIGNAL_SELL_COLOR = "#B91C1C";

export type StrategyPresetId = "all" | "crossover" | "breakout";

export const TRUST_PILLS = [
  { label: "Real-time execution", detail: "Order latency <50ms" },
  { label: "Institutional Grade", detail: "Pro-tier matching engine" },
  { label: "Bank-level Security", detail: "Cold storage & 2FA" },
];

export const TRY_THESE_STEPS = [
  { step: 1, text: "Click an alert row to load its thesis and chart." },
  { step: 2, text: "Notice the chart overlays the exact crossover or breakout." },
  { step: 3, text: "Filter by strategy using the chips above the list." },
];

export const STRATEGY_PRESETS: Array<{
  id: StrategyPresetId;
  label: string;
  visibleKeys: string[] | "all";
}> = [
  { id: "all", label: "All", visibleKeys: "all" },
  { id: "crossover", label: "Momentum", visibleKeys: ["CROSS"] },
  { id: "breakout", label: "Breakouts", visibleKeys: ["EXCEED"] },
];
