import type { CoinbaseGranularity } from "./types";

const EXERIA_TO_COINBASE: Record<string, CoinbaseGranularity> = {
  "1m": "ONE_MINUTE",
  "5m": "FIVE_MINUTE",
  "15m": "FIFTEEN_MINUTE",
  "30m": "THIRTY_MINUTE",
  "1h": "ONE_HOUR",
  "2h": "TWO_HOUR",
  "4h": "FOUR_HOUR",
  "6h": "SIX_HOUR",
  "1d": "ONE_DAY",
};

const GRANULARITY_SECONDS: Record<CoinbaseGranularity, number> = {
  ONE_MINUTE: 60,
  FIVE_MINUTE: 300,
  FIFTEEN_MINUTE: 900,
  THIRTY_MINUTE: 1800,
  ONE_HOUR: 3600,
  TWO_HOUR: 7200,
  FOUR_HOUR: 14400,
  SIX_HOUR: 21600,
  ONE_DAY: 86400,
};

const DEFAULT_EXERIA_INTERVAL = "1h";

export function toCoinbaseGranularity(interval: string): CoinbaseGranularity {
  if (!interval) {
    return EXERIA_TO_COINBASE[DEFAULT_EXERIA_INTERVAL]!;
  }

  if (interval in EXERIA_TO_COINBASE) {
    return EXERIA_TO_COINBASE[interval]!;
  }

  throw new Error(
    `Unsupported Coinbase interval: ${interval}. Supported: ${Object.keys(EXERIA_TO_COINBASE).join(", ")}`,
  );
}

export function resolveExeriaInterval(interval: string): string {
  if (!interval) {
    return DEFAULT_EXERIA_INTERVAL;
  }

  if (interval in EXERIA_TO_COINBASE) {
    return interval;
  }

  return interval;
}

/** Coinbase rejects windows that imply more than 350 candles per request. */
export const COINBASE_MAX_CANDLES_PER_REQUEST = 349;

export function capCoinbasePageLimit(limit: number): number {
  return Math.min(Math.max(limit, 1), COINBASE_MAX_CANDLES_PER_REQUEST);
}

export function granularitySeconds(interval: string): number {
  const granularity = toCoinbaseGranularity(interval);
  return GRANULARITY_SECONDS[granularity];
}

export function estimateRangeSeconds(
  interval: string,
  limit: number,
): number {
  return granularitySeconds(interval) * capCoinbasePageLimit(limit);
}
