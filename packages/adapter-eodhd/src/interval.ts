import type {
  EodhdDataSource,
  EodhdEodPeriod,
  EodhdIntradayInterval,
} from "./types";

const UNSUPPORTED_INTERVALS = new Set(["15m", "30m", "2h", "4h", "3m"]);

const EXERIA_TO_EOD_PERIOD: Record<string, EodhdEodPeriod> = {
  "1d": "d",
  "1w": "w",
  "1M": "m",
};

const EXERIA_TO_INTRADAY: Record<string, EodhdIntradayInterval> = {
  "1m": "1m",
  "5m": "5m",
  "1h": "1h",
};

export function assertSupportedInterval(interval: string): void {
  if (UNSUPPORTED_INTERVALS.has(interval)) {
    throw new Error(
      `EODHD does not support interval "${interval}". Supported: 1m, 5m, 1h, 1d, 1w, 1M`,
    );
  }

  if (!resolveDataSource(interval)) {
    throw new Error(
      `Unsupported interval "${interval}". Supported: 1m, 5m, 1h, 1d, 1w, 1M`,
    );
  }
}

export function resolveDataSource(interval: string): EodhdDataSource | null {
  if (interval in EXERIA_TO_EOD_PERIOD) {
    return "eod";
  }

  if (interval in EXERIA_TO_INTRADAY) {
    return "intraday";
  }

  return null;
}

export function toEodhdPeriod(interval: string): EodhdEodPeriod {
  assertSupportedInterval(interval);
  const period = EXERIA_TO_EOD_PERIOD[interval];

  if (!period) {
    throw new Error(`Interval "${interval}" is not an EOD period`);
  }

  return period;
}

export function toEodhdIntradayInterval(interval: string): EodhdIntradayInterval {
  assertSupportedInterval(interval);
  const eodhdInterval = EXERIA_TO_INTRADAY[interval];

  if (!eodhdInterval) {
    throw new Error(`Interval "${interval}" is not an intraday interval`);
  }

  return eodhdInterval;
}

export function intradayWindowSeconds(interval: EodhdIntradayInterval): number {
  switch (interval) {
    case "1m":
      return 120 * 86_400;
    case "5m":
      return 600 * 86_400;
    case "1h":
      return 7200 * 86_400;
    default:
      return 120 * 86_400;
  }
}

export function intervalToMilliseconds(interval: string): number {
  const unitMs: Record<string, number> = {
    "1m": 60_000,
    "5m": 5 * 60_000,
    "1h": 3_600_000,
    "1d": 86_400_000,
    "1w": 7 * 86_400_000,
    "1M": 30 * 86_400_000,
  };

  return unitMs[interval] ?? 86_400_000;
}
