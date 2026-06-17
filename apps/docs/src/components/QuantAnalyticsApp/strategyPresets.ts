export type QuantPresetId =
  | "macdCrossover"
  | "bollingerBreakout"
  | "meanReversion"
  | "slowBandReversion";

export type QuantPresetDefinition = {
  id: QuantPresetId;
  label: string;
  shortLabel: string;
  description: string;
  scripts: string[];
  strategyField: "CrossValue" | "ExceedValue" | "Rebound" | "Join";
};

export const QUANT_PRESETS: QuantPresetDefinition[] = [
  {
    id: "macdCrossover",
    label: "WMA / EMA composite",
    shortLabel: "JOIN",
    description:
      "WMA(14) and EMA(28) overlays with Greater-Less filters, Cross confirmation, Join merge, and equity curve.",
    scripts: ["WMA", "EMA", "GREATERLESS", "CROSS", "DOUBLECHECK", "JOIN", "EQUITY"],
    strategyField: "Join",
  },
  {
    id: "bollingerBreakout",
    label: "Bollinger breakout",
    shortLabel: "EXCEED",
    description: "Buy or sell when price closes outside the Bollinger bands.",
    scripts: ["BBAND", "EXCEED", "EQUITY"],
    strategyField: "ExceedValue",
  },
  {
    id: "meanReversion",
    label: "Band mean reversion",
    shortLabel: "REBOUND",
    description: "Signals when price returns inside the bands after an excursion.",
    scripts: ["BBAND", "REBOUND", "EQUITY"],
    strategyField: "Rebound",
  },
  {
    id: "slowBandReversion",
    label: "Slow-band reversion",
    shortLabel: "BB-20",
    description:
      "Mean reversion on wider 20-period Bollinger bands — buy lower-band rebounds, sell upper-band fades.",
    scripts: ["BBAND", "REBOUND", "EQUITY"],
    strategyField: "Rebound",
  },
];

export const DEFAULT_PRESET_ID: QuantPresetId = "macdCrossover";

export function findQuantPreset(id: QuantPresetId): QuantPresetDefinition {
  return QUANT_PRESETS.find((preset) => preset.id === id) ?? QUANT_PRESETS[0]!;
}
