import btcUsdHourly from "../../../web/data/BTCUSD.json";
import bnbUsdHourly from "../../../web/data/BNBUSD.json";
import type { Candle, Interval } from "@efixdata/exeria-chart";

export type ExampleDatasetKey = "trend" | "range";

export interface ExampleDataset {
  label: string;
  candles: Candle[];
}

interface IndexedCandleArrays {
  t: number[];
  o: number[];
  h: number[];
  l: number[];
  c: number[];
  v?: number[];
}

interface CandleContainer {
  candles: Candle[];
}

type CandleSource = CandleContainer | Candle[] | IndexedCandleArrays | unknown;

export const docsInterval: Interval = {
  symbol: "1h",
  milis: 60 * 60 * 1000,
};

const maxDocsCandleCount = 1000;

function isCandleContainer(source: CandleSource): source is CandleContainer {
  return typeof source === "object" && source !== null && Array.isArray((source as CandleContainer).candles);
}

function isIndexedCandleArrays(source: CandleSource): source is IndexedCandleArrays {
  return typeof source === "object" && source !== null && Array.isArray((source as IndexedCandleArrays).t);
}

function normalizeCandles(source: CandleSource): Candle[] {
  if (isCandleContainer(source)) {
    return source.candles.map((candle: Candle) => {
      const nextCandle: Candle = {
        stamp: candle.stamp,
        o: candle.o,
        h: candle.h,
        l: candle.l,
        c: candle.c,
      };

      if (typeof candle.v === "number") {
        nextCandle.v = candle.v;
      }

      return nextCandle;
    });
  }

  if (Array.isArray(source)) {
    return source.map((candle: Candle) => {
      const nextCandle: Candle = {
        stamp: candle.stamp,
        o: candle.o,
        h: candle.h,
        l: candle.l,
        c: candle.c,
      };

      if (typeof candle.v === "number") {
        nextCandle.v = candle.v;
      }

      return nextCandle;
    });
  }

  if (!isIndexedCandleArrays(source)) {
    return [];
  }

  const candles: Candle[] = [];

  source.t.forEach((stamp: number, index: number) => {
    const o = source.o[index];
    const h = source.h[index];
    const l = source.l[index];
    const c = source.c[index];

    if (
      typeof o !== "number" ||
      typeof h !== "number" ||
      typeof l !== "number" ||
      typeof c !== "number"
    ) {
      return;
    }

    const nextCandle: Candle = {
      stamp,
      o,
      h,
      l,
      c,
    };

    const v = source.v?.[index];
    if (typeof v === "number") {
      nextCandle.v = v;
    }

    candles.push(nextCandle);
  });

  return candles;
}

const btcHourlyCandles = normalizeCandles(btcUsdHourly);
const bnbHourlyCandles = normalizeCandles(bnbUsdHourly);

export const docsCandleCount = Math.min(maxDocsCandleCount, btcHourlyCandles.length, bnbHourlyCandles.length);

const docsBtcCandles = btcHourlyCandles.slice(-docsCandleCount);
const docsBnbCandles = bnbHourlyCandles.slice(-docsCandleCount);

export const docsExampleDatasets: Record<ExampleDatasetKey, ExampleDataset> = {
  trend: {
    label: "BTC/USD hourly fixture",
    candles: docsBtcCandles,
  },
  range: {
    label: "BNB/USD hourly fixture",
    candles: docsBnbCandles,
  },
};

export const drawingShowcaseCandles = docsBtcCandles;

export function getCandleAtRatio(candles: Candle[], ratio: number): Candle {
  const index = Math.max(0, Math.min(candles.length - 1, Math.round((candles.length - 1) * ratio)));
  const candle = candles[index];

  if (!candle) {
    throw new Error(`Missing candle at index ${index}`);
  }

  return candle;
}