import type { Candle } from "@efixdata/exeria-chart";
import { findLastScreenerStrategySignal } from "./screenerStrategyHits";
import type { ScreenerSignal } from "./signalCatalog";
import { BINANCE_REST_URL } from "../CryptoTerminalApp/binancePublicStreams";

const CACHE_MS = 60_000;
const HOUR_MS = 3_600_000;
export const MINI_CHART_MIN_PERIODS = 60;
const cache = new Map<string, { candles: Candle[]; fetchedAt: number }>();

export type MiniChartWindow = {
  candles: Candle[];
  signalBarIndex: number;
};

export type ResolvedMiniChartSignal = {
  barIndex: number;
  candle: Candle;
};

export async function fetchMiniChartCandles(symbol: string, limit = 120): Promise<Candle[]> {
  const cached = cache.get(symbol);
  if (cached && Date.now() - cached.fetchedAt < CACHE_MS) {
    return cached.candles.map((candle) => ({ ...candle }));
  }

  const url = new URL(`${BINANCE_REST_URL}/api/v3/klines`);
  url.searchParams.set("symbol", symbol);
  url.searchParams.set("interval", "1h");
  url.searchParams.set("limit", String(limit));

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error("Failed to load candles");
  }

  const rows = (await response.json()) as Array<
    [number, string, string, string, string, string, ...unknown[]]
  >;

  const candles: Candle[] = rows.map((row) => ({
    stamp: row[0],
    o: Number.parseFloat(row[1]),
    h: Number.parseFloat(row[2]),
    l: Number.parseFloat(row[3]),
    c: Number.parseFloat(row[4]),
    v: Number.parseFloat(row[5]),
  }));

  cache.set(symbol, { candles, fetchedAt: Date.now() });
  return candles;
}

export function alignHourDown(timestamp: number): number {
  return Math.floor(timestamp / HOUR_MS) * HOUR_MS;
}

export { HOUR_MS };

export function findSignalBarIndex(candles: Candle[], signalTimestamp: number): number {
  if (candles.length === 0) {
    return 0;
  }

  const aligned = alignHourDown(signalTimestamp);
  const exact = candles.findIndex((candle) => candle.stamp === aligned);
  if (exact >= 0) {
    return exact;
  }

  let bestIndex = candles.length - 1;
  let bestDiff = Number.POSITIVE_INFINITY;

  for (let index = 0; index < candles.length; index += 1) {
    const diff = Math.abs(candles[index]!.stamp - signalTimestamp);
    if (diff < bestDiff) {
      bestDiff = diff;
      bestIndex = index;
    }
  }

  return bestIndex;
}

function findStrategyHitOnWindow(candles: Candle[], symbol: string) {
  return findLastScreenerStrategySignal(candles, symbol);
}

/** Map screener row → bar on the mini-chart window (same strategy logic as list). */
export function resolveSignalOnWindow(
  candles: Candle[],
  signal: ScreenerSignal,
): ResolvedMiniChartSignal {
  const strategyHit = findStrategyHitOnWindow(candles, signal.symbol);

  if (
    strategyHit &&
    strategyHit.timestamp === signal.timestamp &&
    strategyHit.side === signal.side
  ) {
    const candle = candles[strategyHit.barIndex]!;
    return { barIndex: strategyHit.barIndex, candle };
  }

  const barIndex = findSignalBarIndex(candles, signal.timestamp);
  return { barIndex, candle: candles[barIndex] ?? candles[candles.length - 1]! };
}

export function miniChartFetchLimit(signalTimestamp: number, now = Date.now()): number {
  const periodsAfter = Math.max(1, Math.ceil((now - signalTimestamp) / HOUR_MS));
  const desired = Math.max(MINI_CHART_MIN_PERIODS, periodsAfter * 2) + 24;
  return Math.min(500, desired);
}

/**
 * At least {@link MINI_CHART_MIN_PERIODS} hourly bars.
 * New signals: window extends backward, signal sits on the right.
 * Older signals: symmetric window around the signal (centered).
 */
export function buildMiniChartWindow(
  candles: Candle[],
  signalTimestamp: number,
  now = Date.now(),
): MiniChartWindow {
  const periodsAfter = Math.max(1, Math.ceil((now - signalTimestamp) / HOUR_MS));
  const signalAligned = alignHourDown(signalTimestamp);

  let windowStart: number;
  let windowEnd: number;

  if (periodsAfter * 2 >= MINI_CHART_MIN_PERIODS) {
    windowStart = alignHourDown(signalTimestamp - periodsAfter * HOUR_MS);
    windowEnd = alignHourDown(signalTimestamp + periodsAfter * HOUR_MS);
  } else {
    windowEnd = alignHourDown(now);
    windowStart = windowEnd - (MINI_CHART_MIN_PERIODS - 1) * HOUR_MS;
  }

  if (signalAligned < windowStart) {
    windowStart = signalAligned - (MINI_CHART_MIN_PERIODS - 1) * HOUR_MS;
  }

  const stamps: number[] = [];
  for (let stamp = windowStart; stamp <= windowEnd; stamp += HOUR_MS) {
    stamps.push(stamp);
  }

  const candleByStamp = new Map(candles.map((candle) => [candle.stamp, candle]));
  const seed =
    candles.find((candle) => candle.stamp <= windowStart) ??
    candles.find((candle) => candle.stamp >= windowStart) ??
    candles[0];

  let lastPrice = seed?.c ?? seed?.o ?? 0;
  const windowCandles: Candle[] = stamps.map((stamp) => {
    const existing = candleByStamp.get(stamp);
    if (existing) {
      lastPrice = existing.c;
      return { ...existing };
    }

    return {
      stamp,
      o: lastPrice,
      h: lastPrice,
      l: lastPrice,
      c: lastPrice,
      v: 0,
    };
  });

  const signalBarIndex = findSignalBarIndex(windowCandles, signalTimestamp);

  return { candles: windowCandles, signalBarIndex };
}

