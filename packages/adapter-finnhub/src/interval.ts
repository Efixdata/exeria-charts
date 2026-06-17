const EXERIA_TO_FINNHUB: Record<string, string> = {
  "1m": "1",
  "5m": "5",
  "15m": "15",
  "30m": "30",
  "1h": "60",
  "2h": "60",
  "4h": "60",
  "1d": "D",
  "1w": "W",
  "1M": "M",
};

const DEFAULT_RESOLUTION = "60";

export function toFinnhubResolution(interval: string): string {
  if (!interval) {
    return DEFAULT_RESOLUTION;
  }

  if (interval in EXERIA_TO_FINNHUB) {
    return EXERIA_TO_FINNHUB[interval]!;
  }

  return DEFAULT_RESOLUTION;
}

export function intervalToMilliseconds(interval: string): number {
  const unitMs: Record<string, number> = {
    "1m": 60_000,
    "5m": 5 * 60_000,
    "15m": 15 * 60_000,
    "30m": 30 * 60_000,
    "1h": 3_600_000,
    "2h": 2 * 3_600_000,
    "4h": 4 * 3_600_000,
    "1d": 86_400_000,
    "1w": 7 * 86_400_000,
    "1M": 30 * 86_400_000,
  };

  return unitMs[interval] ?? 3_600_000;
}
