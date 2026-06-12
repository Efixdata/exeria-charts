export const MIN_CHART_BARS = 100;

export type FintechPeriodId = "1d" | "1w" | "1m" | "3m" | "1y" | "max";

export type FintechViewId = "overview" | "holdings";

export type FintechAsset = {
  id: string;
  symbol: string;
  label: string;
  color: string;
  allocation: number;
  sector: string;
};

export type WatchlistItem = {
  id: string;
  symbol: string;
  label: string;
  color: string;
};

export const FINTECH_PERIODS: Array<{ id: FintechPeriodId; label: string; interval: string; limit: number }> = [
  { id: "1d", label: "1D", interval: "1h", limit: MIN_CHART_BARS },
  { id: "1w", label: "1W", interval: "4h", limit: MIN_CHART_BARS },
  { id: "1m", label: "1M", interval: "1d", limit: MIN_CHART_BARS },
  { id: "3m", label: "3M", interval: "1d", limit: MIN_CHART_BARS },
  { id: "1y", label: "1Y", interval: "1d", limit: MIN_CHART_BARS },
  { id: "max", label: "MAX", interval: "1w", limit: MIN_CHART_BARS },
];

export const FINTECH_APP_NAME = "Nova Wealth";
