import type { Candle } from "@exeria/charts";
import type { MarketNewsPeriodId } from "./constants";
import { MARKET_NEWS_PERIODS } from "./constants";

export function sliceCandlesByPeriod(candles: Candle[], periodId: MarketNewsPeriodId): Candle[] {
  const period = MARKET_NEWS_PERIODS.find((entry) => entry.id === periodId) ?? MARKET_NEWS_PERIODS[1]!;
  const limit = Math.min(period.bars, candles.length);
  return candles.slice(-limit);
}

export function indexCandlesToBase(candles: Candle[], base = 100): Candle[] {
  if (candles.length === 0) {
    return [];
  }

  const anchor = candles[0]!.c;
  if (anchor === 0) {
    return candles;
  }

  const scale = base / anchor;

  return candles.map((candle) => ({
    ...candle,
    o: candle.o * scale,
    h: candle.h * scale,
    l: candle.l * scale,
    c: candle.c * scale,
  }));
}

export function computeChangePercent(candles: Candle[]): number {
  if (candles.length < 2) {
    return 0;
  }

  const first = candles[0]!.c;
  const last = candles.at(-1)!.c;
  if (first === 0) {
    return 0;
  }

  return ((last - first) / first) * 100;
}

export function readSparklineValues(candles: Candle[], points = 48): number[] {
  const slice = candles.slice(-points);
  return slice.map((candle) => candle.c);
}
