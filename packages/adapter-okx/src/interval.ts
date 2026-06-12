import type { OkxBar } from "./types";

const EXERIA_TO_OKX_BAR: Record<string, OkxBar> = {
  "1m": "1m",
  "3m": "3m",
  "5m": "5m",
  "15m": "15m",
  "30m": "30m",
  "1h": "1H",
  "2h": "2H",
  "4h": "4H",
  "6h": "6H",
  "12h": "12H",
  "1d": "1D",
  "1w": "1W",
  "1M": "1M",
};

const OKX_BAR_TO_EXERIA: Record<string, string> = Object.fromEntries(
  Object.entries(EXERIA_TO_OKX_BAR).map(([exeria, okx]) => [okx, exeria]),
);

const DEFAULT_EXERIA_INTERVAL = "1h";
const DEFAULT_OKX_BAR: OkxBar = "1H";

export function toOkxBar(interval: string): OkxBar {
  if (!interval) {
    return DEFAULT_OKX_BAR;
  }

  if (interval in EXERIA_TO_OKX_BAR) {
    return EXERIA_TO_OKX_BAR[interval]!;
  }

  return interval as OkxBar;
}

export function toExeriaInterval(bar: string): string {
  return OKX_BAR_TO_EXERIA[bar] ?? bar.toLowerCase();
}

export function resolveExeriaInterval(interval: string): string {
  if (!interval) {
    return DEFAULT_EXERIA_INTERVAL;
  }

  if (interval in EXERIA_TO_OKX_BAR) {
    return interval;
  }

  return toExeriaInterval(interval);
}

export function getCandleChannel(exeriaInterval: string): string {
  return `candle${toOkxBar(exeriaInterval)}`;
}

export function getSubscriptionKey(channel: string, instId: string): string {
  return `${channel}:${instId}`;
}
