import type { OpportunityFilter } from "./constants";
import type { ForexTimeframeId } from "./forexInstruments";

export type ScenarioPresetId = "macro-week" | "arb-hunt" | "breakout-scan";

export type ScenarioPreset = {
  id: ScenarioPresetId;
  label: string;
  description: string;
  filter: OpportunityFilter;
  defaultSymbol: string;
  defaultTimeframe: ForexTimeframeId;
  defaultOpportunityId: string;
};

export const SCENARIO_PRESETS: ScenarioPreset[] = [
  {
    id: "macro-week",
    label: "Macro week",
    description: "News-heavy — CPI, ECB, NFP on the chart timeline",
    filter: "events",
    defaultSymbol: "EUR/USD",
    defaultTimeframe: "m15",
    defaultOpportunityId: "event-cpi",
  },
  {
    id: "arb-hunt",
    label: "Arb hunt",
    description: "Cross-rate mispricing and correlation breaks",
    filter: "arb",
    defaultSymbol: "EUR/USD",
    defaultTimeframe: "m15",
    defaultOpportunityId: "arb-triangular",
  },
  {
    id: "breakout-scan",
    label: "Breakout scan",
    description: "Vol squeeze and strategy confluence markers",
    filter: "rare",
    defaultSymbol: "USD/JPY",
    defaultTimeframe: "h1",
    defaultOpportunityId: "rare-squeeze",
  },
];

export function findScenarioPreset(id: ScenarioPresetId): ScenarioPreset {
  return SCENARIO_PRESETS.find((preset) => preset.id === id) ?? SCENARIO_PRESETS[0]!;
}
