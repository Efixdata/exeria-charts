import type { Candle } from "@exeria/charts";
import type { ForexTimeframeId } from "./forexInstruments";
import { findForexTimeframe } from "./forexInstruments";

export type ForexStaticDataset = {
  symbol: string;
  timeframeId: ForexTimeframeId;
  interval: string;
  endStamp: number;
  candleCount: number;
  source: string;
  generatedAt: string;
  candles: Candle[];
};

const PAIR_SLUGS: Record<string, string> = {
  "EUR/USD": "eur-usd",
  "GBP/USD": "gbp-usd",
  "USD/JPY": "usd-jpy",
  "USD/CHF": "usd-chf",
  "EUR/GBP": "eur-gbp",
};

const DATASET_LOADERS: Record<string, () => Promise<ForexStaticDataset>> = {
  "eur-usd-m15": async () => (await import("./data/eur-usd-m15.json")).default as ForexStaticDataset,
  "eur-usd-h1": async () => (await import("./data/eur-usd-h1.json")).default as ForexStaticDataset,
  "gbp-usd-m15": async () => (await import("./data/gbp-usd-m15.json")).default as ForexStaticDataset,
  "gbp-usd-h1": async () => (await import("./data/gbp-usd-h1.json")).default as ForexStaticDataset,
  "usd-jpy-m15": async () => (await import("./data/usd-jpy-m15.json")).default as ForexStaticDataset,
  "usd-jpy-h1": async () => (await import("./data/usd-jpy-h1.json")).default as ForexStaticDataset,
  "usd-chf-m15": async () => (await import("./data/usd-chf-m15.json")).default as ForexStaticDataset,
  "usd-chf-h1": async () => (await import("./data/usd-chf-h1.json")).default as ForexStaticDataset,
  "eur-gbp-m15": async () => (await import("./data/eur-gbp-m15.json")).default as ForexStaticDataset,
  "eur-gbp-h1": async () => (await import("./data/eur-gbp-h1.json")).default as ForexStaticDataset,
};

const candleCache = new Map<string, Candle[]>();

export function pairSymbolToSlug(symbol: string): string {
  return PAIR_SLUGS[symbol] ?? symbol.toLowerCase().replace("/", "-");
}

export function resolveStaticDatasetKey(symbol: string, timeframeId: ForexTimeframeId): string {
  return `${pairSymbolToSlug(symbol)}-${timeframeId}`;
}

export function intervalToForexTimeframeId(interval: string): ForexTimeframeId {
  switch (interval) {
    case "15m":
      return "m15";
    case "1h":
      return "h1";
    default:
      return findForexTimeframe("h1").id;
  }
}

export async function loadStaticForexCandles(
  symbol: string,
  timeframeId: ForexTimeframeId,
  limit?: number,
): Promise<Candle[]> {
  const cacheKey = resolveStaticDatasetKey(symbol, timeframeId);
  let candles = candleCache.get(cacheKey);

  if (!candles) {
    const loader = DATASET_LOADERS[cacheKey];
    if (!loader) {
      throw new Error(`Missing static forex dataset for ${symbol} ${timeframeId}`);
    }

    const dataset = await loader();
    candles = dataset.candles;
    candleCache.set(cacheKey, candles);
  }

  if (limit != null && limit > 0 && limit < candles.length) {
    return candles.slice(-limit);
  }

  return candles;
}
