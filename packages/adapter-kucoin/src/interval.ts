import type { KucoinCandleType } from "./types";

const EXERIA_TO_KUCOIN_TYPE: Record<string, KucoinCandleType> = {
  "1m": "1min",
  "3m": "3min",
  "5m": "5min",
  "15m": "15min",
  "30m": "30min",
  "1h": "1hour",
  "2h": "2hour",
  "4h": "4hour",
  "6h": "6hour",
  "8h": "8hour",
  "12h": "12hour",
  "1d": "1day",
  "1w": "1week",
};

const KUCOIN_TYPE_TO_EXERIA: Record<string, string> = Object.fromEntries(
  Object.entries(EXERIA_TO_KUCOIN_TYPE).map(([exeria, kucoin]) => [
    kucoin,
    exeria,
  ]),
);

const WS_SUPPORTED_TYPES = new Set<KucoinCandleType>([
  "1min",
  "3min",
  "15min",
  "30min",
  "1hour",
  "2hour",
  "4hour",
  "6hour",
  "8hour",
  "12hour",
  "1day",
  "1week",
]);

const DEFAULT_EXERIA_INTERVAL = "1h";
const DEFAULT_KUCOIN_TYPE: KucoinCandleType = "1hour";

export function toKucoinType(interval: string): KucoinCandleType {
  if (!interval) {
    return DEFAULT_KUCOIN_TYPE;
  }

  if (interval in EXERIA_TO_KUCOIN_TYPE) {
    return EXERIA_TO_KUCOIN_TYPE[interval]!;
  }

  if (interval in KUCOIN_TYPE_TO_EXERIA) {
    return interval as KucoinCandleType;
  }

  throw new Error(`Unsupported KuCoin interval: ${interval}`);
}

export function toExeriaInterval(type: string): string {
  return KUCOIN_TYPE_TO_EXERIA[type] ?? type;
}

export function resolveExeriaInterval(interval: string): string {
  if (!interval) {
    return DEFAULT_EXERIA_INTERVAL;
  }

  if (interval in EXERIA_TO_KUCOIN_TYPE) {
    return interval;
  }

  return toExeriaInterval(interval);
}

export function isWsSupportedInterval(interval: string): boolean {
  const type = toKucoinType(resolveExeriaInterval(interval));
  return WS_SUPPORTED_TYPES.has(type);
}

export function getCandleTopic(symbol: string, interval: string): string {
  return `/market/candles:${symbol}_${toKucoinType(interval)}`;
}

export function getSubscriptionKey(topic: string): string {
  return topic;
}
