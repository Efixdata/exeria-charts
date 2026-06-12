import type { BybitInterval } from "./types";

const EXERIA_TO_BYBIT: Record<string, BybitInterval> = {
  "1m": "1",
  "3m": "3",
  "5m": "5",
  "15m": "15",
  "30m": "30",
  "1h": "60",
  "2h": "120",
  "4h": "240",
  "6h": "360",
  "12h": "720",
  "1d": "D",
  "1w": "W",
  "1M": "M",
};

const BYBIT_TO_EXERIA: Record<string, string> = Object.fromEntries(
  Object.entries(EXERIA_TO_BYBIT).map(([exeria, bybit]) => [bybit, exeria]),
);

const DEFAULT_EXERIA_INTERVAL = "1h";
const DEFAULT_BYBIT_INTERVAL: BybitInterval = "60";

export function toBybitInterval(interval: string): BybitInterval {
  if (!interval) {
    return DEFAULT_BYBIT_INTERVAL;
  }

  if (interval in EXERIA_TO_BYBIT) {
    return EXERIA_TO_BYBIT[interval]!;
  }

  return interval as BybitInterval;
}

export function toExeriaInterval(interval: string): string {
  return BYBIT_TO_EXERIA[interval] ?? interval;
}

export function resolveExeriaInterval(interval: string): string {
  if (!interval) {
    return DEFAULT_EXERIA_INTERVAL;
  }

  if (interval in EXERIA_TO_BYBIT) {
    return interval;
  }

  return toExeriaInterval(interval);
}

export function getKlineTopic(symbol: string, exeriaInterval: string): string {
  const bybitInterval = toBybitInterval(exeriaInterval);
  return `kline.${bybitInterval}.${symbol.toUpperCase()}`;
}
