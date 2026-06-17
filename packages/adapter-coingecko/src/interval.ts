import type { CoingeckoChartInterval, CoingeckoDays } from "./types";

const DEFAULT_EXERIA_INTERVAL = "1d";

const EXERIA_ALIASES: Record<string, string> = {
  "1D": "1d",
  "1H": "1h",
  "1W": "1w",
};

export function resolveExeriaInterval(interval: string): string {
  if (!interval) {
    return DEFAULT_EXERIA_INTERVAL;
  }

  if (interval in EXERIA_ALIASES) {
    return EXERIA_ALIASES[interval]!;
  }

  return interval;
}

export function daysForInterval(
  interval: string,
  limit?: number,
): CoingeckoDays {
  const exeriaInterval = resolveExeriaInterval(interval);

  switch (exeriaInterval) {
    case "1d":
      if (limit !== undefined && limit > 180) {
        return "max";
      }
      if (limit !== undefined && limit > 90) {
        return "180";
      }
      return "90";
    case "1w":
      return "max";
    case "1h":
      return "7";
    case "1m":
    case "5m":
    case "15m":
    case "30m":
      return "1";
    default:
      return "30";
  }
}

export function chartIntervalForExeria(
  interval: string,
): CoingeckoChartInterval | undefined {
  const exeriaInterval = resolveExeriaInterval(interval);

  switch (exeriaInterval) {
    case "1d":
    case "1w":
      return "daily";
    case "1h":
      return "hourly";
    default:
      return undefined;
  }
}
