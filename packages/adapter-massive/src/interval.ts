import type { MassiveRange, MassiveTimespan } from "./types";

const EXERIA_TO_MASSIVE: Record<string, MassiveRange> = {
  "1m": { multiplier: 1, timespan: "minute" },
  "3m": { multiplier: 3, timespan: "minute" },
  "5m": { multiplier: 5, timespan: "minute" },
  "15m": { multiplier: 15, timespan: "minute" },
  "30m": { multiplier: 30, timespan: "minute" },
  "1h": { multiplier: 1, timespan: "hour" },
  "2h": { multiplier: 2, timespan: "hour" },
  "4h": { multiplier: 4, timespan: "hour" },
  "6h": { multiplier: 6, timespan: "hour" },
  "8h": { multiplier: 8, timespan: "hour" },
  "12h": { multiplier: 12, timespan: "hour" },
  "1d": { multiplier: 1, timespan: "day" },
  "1w": { multiplier: 1, timespan: "week" },
  "1M": { multiplier: 1, timespan: "month" },
};

const DEFAULT_EXERIA_INTERVAL = "1h";

export function toMassiveRange(interval: string): MassiveRange {
  if (!interval) {
    return EXERIA_TO_MASSIVE[DEFAULT_EXERIA_INTERVAL]!;
  }

  if (interval in EXERIA_TO_MASSIVE) {
    return EXERIA_TO_MASSIVE[interval]!;
  }

  throw new Error(`Unsupported Massive interval: ${interval}`);
}

export function resolveExeriaInterval(interval: string): string {
  if (!interval) {
    return DEFAULT_EXERIA_INTERVAL;
  }

  if (interval in EXERIA_TO_MASSIVE) {
    return interval;
  }

  return interval;
}

export function estimateRangeMs(interval: string, limit: number): number {
  const { multiplier, timespan } = toMassiveRange(interval);
  const unitMs: Record<MassiveTimespan, number> = {
    minute: 60_000,
    hour: 3_600_000,
    day: 86_400_000,
    week: 7 * 86_400_000,
    month: 30 * 86_400_000,
    quarter: 90 * 86_400_000,
    year: 365 * 86_400_000,
  };

  return multiplier * unitMs[timespan] * limit * 1.2;
}
