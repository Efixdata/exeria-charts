import type { GateInterval } from "./types";

const EXERIA_TO_GATE: Record<string, GateInterval> = {
  "1m": "1m",
  "5m": "5m",
  "15m": "15m",
  "30m": "30m",
  "1h": "1h",
  "4h": "4h",
  "1d": "1d",
  "1w": "7d",
};

const GATE_TO_EXERIA: Record<string, string> = Object.fromEntries(
  Object.entries(EXERIA_TO_GATE).map(([exeria, gate]) => [gate, exeria]),
);

const INTERVAL_SECONDS: Record<GateInterval, number> = {
  "10s": 10,
  "1m": 60,
  "5m": 300,
  "15m": 900,
  "30m": 1800,
  "1h": 3600,
  "4h": 14400,
  "8h": 28800,
  "1d": 86400,
  "7d": 604800,
};

const DEFAULT_EXERIA_INTERVAL = "1h";
const DEFAULT_GATE_INTERVAL: GateInterval = "1h";

const WS_SUPPORTED_INTERVALS = new Set<GateInterval>([
  "10s",
  "1m",
  "5m",
  "15m",
  "30m",
  "1h",
  "4h",
  "8h",
  "1d",
  "7d",
]);

export function toGateInterval(interval: string): GateInterval {
  if (!interval) {
    return DEFAULT_GATE_INTERVAL;
  }

  if (interval in EXERIA_TO_GATE) {
    return EXERIA_TO_GATE[interval]!;
  }

  if (interval in GATE_TO_EXERIA || interval in INTERVAL_SECONDS) {
    return interval as GateInterval;
  }

  throw new Error(
    `Unsupported Gate.io interval: ${interval}. Supported: ${Object.keys(EXERIA_TO_GATE).join(", ")}`,
  );
}

export function resolveExeriaInterval(interval: string): string {
  if (!interval) {
    return DEFAULT_EXERIA_INTERVAL;
  }

  if (interval in EXERIA_TO_GATE) {
    return interval;
  }

  return GATE_TO_EXERIA[interval] ?? interval;
}

export function isWsSupportedInterval(interval: string): boolean {
  const gateInterval = toGateInterval(resolveExeriaInterval(interval));
  return WS_SUPPORTED_INTERVALS.has(gateInterval);
}

export function estimateRangeSeconds(interval: string, limit: number): number {
  const gateInterval = toGateInterval(interval);
  return Math.ceil(INTERVAL_SECONDS[gateInterval] * limit * 1.2);
}

export function getSubscriptionKey(
  currencyPair: string,
  interval: string,
): string {
  return `${currencyPair}:${toGateInterval(interval)}`;
}
