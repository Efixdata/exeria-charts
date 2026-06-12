import type { FinageInterval } from "./types";

const EXERIA_TO_FINAGE: Record<string, FinageInterval> = {
  "1m": { multiply: 1, time: "minute" },
  "5m": { multiply: 5, time: "minute" },
  "15m": { multiply: 15, time: "minute" },
  "30m": { multiply: 30, time: "minute" },
  "1h": { multiply: 1, time: "hour" },
  "2h": { multiply: 2, time: "hour" },
  "4h": { multiply: 4, time: "hour" },
  "1d": { multiply: 1, time: "day" },
  "1w": { multiply: 1, time: "week" },
  "1M": { multiply: 1, time: "month" },
};

const DEFAULT_INTERVAL: FinageInterval = { multiply: 1, time: "hour" };

export function toFinageInterval(interval: string): FinageInterval {
  if (!interval) {
    return DEFAULT_INTERVAL;
  }

  if (interval in EXERIA_TO_FINAGE) {
    return EXERIA_TO_FINAGE[interval]!;
  }

  return DEFAULT_INTERVAL;
}

export function intervalToMilliseconds(interval: string): number {
  const finage = toFinageInterval(interval);
  const unitMs: Record<string, number> = {
    minute: 60_000,
    hour: 3_600_000,
    day: 86_400_000,
    week: 7 * 86_400_000,
    month: 30 * 86_400_000,
    quarter: 90 * 86_400_000,
    year: 365 * 86_400_000,
  };

  return finage.multiply * (unitMs[finage.time] ?? 3_600_000);
}
