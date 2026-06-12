export type MarketRegime = "risk-on" | "neutral" | "risk-off";

export type MarketSnapshot = {
  btcChange24h: number;
  ethChange24h: number;
  activeSignals: number;
  bullishCount: number;
  bearishCount: number;
  regime: MarketRegime;
  regimeLabel: string;
  fearGreed: number;
  fearGreedLabel: string;
};

export const TRACK_RECORD_DEMO = {
  windowLabel: "30D demo track record",
  winRate: 62,
  signalCount: 47,
  avgReturnPct: 4.2,
  disclaimer: "Illustrative stats for layout demo — not investment performance.",
} as const;

export function getMarketSnapshot(): MarketSnapshot {
  return {
    btcChange24h: 1.84,
    ethChange24h: -0.62,
    activeSignals: 11,
    bullishCount: 6,
    bearishCount: 5,
    regime: "neutral",
    regimeLabel: "Range-bound",
    fearGreed: 54,
    fearGreedLabel: "Neutral",
  };
}
