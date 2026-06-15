export const QUANT_CHART_PRESET_DARK_ID = "midnight";
export const QUANT_CHART_PRESET_LIGHT_ID = "day";

export type QuantAppTheme = "dark" | "light";

export function getQuantChartPresetId(theme: QuantAppTheme): string {
  return theme === "light" ? QUANT_CHART_PRESET_LIGHT_ID : QUANT_CHART_PRESET_DARK_ID;
}

export const DEFAULT_SYMBOL = "EUR/USD";
export const DEFAULT_TIMEFRAME_ID = "h1" as const;

export const INITIAL_EQUITY = 100_000;
