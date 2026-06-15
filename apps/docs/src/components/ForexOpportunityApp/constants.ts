export const FOREX_CHART_PRESET_DARK_ID = "carbon";
export const FOREX_CHART_PRESET_LIGHT_ID = "day";
export const FOREX_CHART_PRESET_ID = FOREX_CHART_PRESET_DARK_ID;

export type ForexAppTheme = "dark" | "light";

export function getForexChartPresetId(theme: ForexAppTheme): string {
  return theme === "light" ? FOREX_CHART_PRESET_LIGHT_ID : FOREX_CHART_PRESET_DARK_ID;
}

export const PIP_SIZE = 0.0001;

/** Default H1 bar length for news highlight overlays (ms). */
export const FOREX_INTERVAL_MILIS = 60 * 60 * 1000;

export type OpportunityFilter = "all" | "arb" | "rare" | "signals" | "events";

export const OPPORTUNITY_FILTERS: Array<{ id: OpportunityFilter; label: string }> = [
  { id: "all", label: "All" },
  { id: "arb", label: "Arb" },
  { id: "rare", label: "Rare" },
  { id: "signals", label: "Signals" },
  { id: "events", label: "Events" },
];
