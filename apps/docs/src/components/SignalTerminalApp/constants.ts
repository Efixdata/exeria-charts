import type { TimeframeId } from "../CryptoTerminalApp/constants";

export { TIMEFRAMES, WATCHLIST_SYMBOLS, type TimeframeId } from "../CryptoTerminalApp/constants";

/** Chart settings + theme preset for screener charts (Carbon). */
export const SCREENER_CHART_PRESET_ID = "carbon";

export const SCREENER_SIGNAL_BUY_COLOR = "#2E7D52";
export const SCREENER_SIGNAL_SELL_COLOR = "#B91C1C";

export type StrategyPresetId = "all" | "crossover" | "breakout";

export const STRATEGY_PRESETS: Array<{
  id: StrategyPresetId;
  label: string;
  visibleKeys: string[] | "all";
}> = [
  { id: "all", label: "All", visibleKeys: "all" },
  { id: "crossover", label: "Momentum", visibleKeys: ["CROSS"] },
  { id: "breakout", label: "Breakouts", visibleKeys: ["EXCEED"] },
];
