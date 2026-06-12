import type { KrakenIntervalMinutes } from "./types";

const EXERIA_TO_KRAKEN: Record<string, KrakenIntervalMinutes> = {
  "1m": 1,
  "5m": 5,
  "15m": 15,
  "30m": 30,
  "1h": 60,
  "4h": 240,
  "1d": 1440,
  "1w": 10080,
  "1M": 21600,
};

const KRAKEN_TO_EXERIA: Record<number, string> = {
  1: "1m",
  5: "5m",
  15: "15m",
  30: "30m",
  60: "1h",
  240: "4h",
  1440: "1d",
  10080: "1w",
  21600: "1M",
};

const EXERIA_ALIASES: Record<string, string> = {
  "1H": "1h",
  "1D": "1d",
  "1W": "1w",
};

const UNSUPPORTED_INTERVALS = new Set(["2h", "3m", "6h", "12h"]);

const DEFAULT_EXERIA_INTERVAL = "1h";
const DEFAULT_KRAKEN_INTERVAL: KrakenIntervalMinutes = 60;

export function resolveExeriaInterval(interval: string): string {
  if (!interval) {
    return DEFAULT_EXERIA_INTERVAL;
  }

  if (interval in EXERIA_ALIASES) {
    return EXERIA_ALIASES[interval]!;
  }

  return interval;
}

export function toKrakenInterval(interval: string): KrakenIntervalMinutes {
  const exeriaInterval = resolveExeriaInterval(interval);

  if (UNSUPPORTED_INTERVALS.has(exeriaInterval)) {
    throw new Error(
      `Unsupported Kraken interval: ${interval}. Supported: 1m, 5m, 15m, 30m, 1h, 4h, 1d, 1w, 1M`,
    );
  }

  if (exeriaInterval in EXERIA_TO_KRAKEN) {
    return EXERIA_TO_KRAKEN[exeriaInterval]!;
  }

  const numeric = Number(exeriaInterval);
  if (numeric in KRAKEN_TO_EXERIA) {
    return numeric as KrakenIntervalMinutes;
  }

  return DEFAULT_KRAKEN_INTERVAL;
}

export function toExeriaInterval(intervalMinutes: number): string {
  return KRAKEN_TO_EXERIA[intervalMinutes] ?? `${intervalMinutes}m`;
}

export function getSubscriptionKey(
  wsSymbol: string,
  intervalMinutes: KrakenIntervalMinutes,
): string {
  return `${wsSymbol}:${intervalMinutes}`;
}
