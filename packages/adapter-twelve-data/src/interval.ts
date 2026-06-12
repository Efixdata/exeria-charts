import type { TwelveDataInterval } from "./types";

const EXERIA_TO_TWELVE_DATA: Record<string, TwelveDataInterval> = {
  "1m": "1min",
  "5m": "5min",
  "15m": "15min",
  "30m": "30min",
  "45m": "45min",
  "1h": "1h",
  "2h": "2h",
  "4h": "4h",
  "8h": "8h",
  "1d": "1day",
  "1w": "1week",
  "1M": "1month",
};

const DEFAULT_INTERVAL: TwelveDataInterval = "1h";

export function toTwelveDataInterval(interval: string): TwelveDataInterval {
  if (!interval) {
    return DEFAULT_INTERVAL;
  }

  if (interval in EXERIA_TO_TWELVE_DATA) {
    return EXERIA_TO_TWELVE_DATA[interval]!;
  }

  return interval as TwelveDataInterval;
}
