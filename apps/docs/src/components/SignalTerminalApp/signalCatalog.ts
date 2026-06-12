export type SignalSide = "buy" | "sell";
export type SignalSource = "strategy" | "api" | "publisher" | "custom";
export type SignalType = "momentum" | "breakout" | "custom";

export type ScreenerSignal = {
  id: string;
  symbol: string;
  pair: string;
  side: SignalSide;
  signalPrice: number;
  timestamp: number;
  source: SignalSource;
  sourceLabel: string;
  signalType: SignalType;
  description: string;
};

export type SignalFilters = {
  symbol: string;
  timeWindowHours: number | "all";
  side: SignalSide | "all";
  source: SignalSource | "custom" | "all";
  signalType: SignalType | "all";
};

export const DEFAULT_FILTERS: SignalFilters = {
  symbol: "all",
  timeWindowHours: "all",
  side: "all",
  source: "all",
  signalType: "all",
};

export function filterSignals(signals: ScreenerSignal[], filters: SignalFilters): ScreenerSignal[] {
  const cutoff =
    filters.timeWindowHours === "all"
      ? 0
      : Date.now() - filters.timeWindowHours * 60 * 60_000;

  return signals.filter((signal) => {
    if (filters.symbol !== "all" && signal.symbol !== filters.symbol) {
      return false;
    }
    if (filters.timeWindowHours !== "all" && signal.timestamp < cutoff) {
      return false;
    }
    if (filters.side !== "all" && signal.side !== filters.side) {
      return false;
    }
    if (filters.source !== "all" && signal.source !== filters.source) {
      return false;
    }
    if (filters.signalType !== "all" && signal.signalType !== filters.signalType) {
      return false;
    }
    return true;
  });
}

export function formatSignalDate(timestamp: number): string {
  return new Date(timestamp).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}
