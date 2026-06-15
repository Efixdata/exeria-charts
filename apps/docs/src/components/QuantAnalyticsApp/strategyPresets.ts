export type QuantPresetId =
  | "macdCrossover"
  | "bollingerBreakout"
  | "meanReversion"
  | "emaSmaCross";

export type QuantPresetDefinition = {
  id: QuantPresetId;
  label: string;
  shortLabel: string;
  description: string;
  scripts: string[];
  strategyField: "CrossValue" | "ExceedValue" | "Rebound";
};

export const QUANT_PRESETS: QuantPresetDefinition[] = [
  {
    id: "macdCrossover",
    label: "MACD crossover",
    shortLabel: "MACD",
    description: "MACD line crosses signal line — classic momentum entries with an equity curve.",
    scripts: ["MACD", "CROSS", "EQUITY"],
    strategyField: "CrossValue",
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
    id: "emaSmaCross",
    label: "EMA vs SMA cross",
    shortLabel: "EMA/SMA",
    description: "Rewire CROSS to EMA(12) and SMA(34) instead of MACD defaults.",
    scripts: ["EMA", "SMA", "CROSS", "EQUITY"],
    strategyField: "CrossValue",
  },
];

export const DEFAULT_PRESET_ID: QuantPresetId = "macdCrossover";

export function findQuantPreset(id: QuantPresetId): QuantPresetDefinition {
  return QUANT_PRESETS.find((preset) => preset.id === id) ?? QUANT_PRESETS[0]!;
}
