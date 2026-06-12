const SUPPORTED_EXERIA_INTERVALS = new Set([
  "1m",
  "3m",
  "5m",
  "15m",
  "30m",
  "1h",
  "2h",
  "4h",
  "6h",
  "12h",
  "1d",
  "1w",
  "1M",
]);

const DEFAULT_INTERVAL = "1h";

export function resolveCcxtTimeframe(interval: string): string {
  if (!interval) {
    return DEFAULT_INTERVAL;
  }

  if (SUPPORTED_EXERIA_INTERVALS.has(interval)) {
    return interval;
  }

  return interval;
}
