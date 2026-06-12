import type { Candle } from "@efixdata/exeria-chart";
import type { MassiveCandleBar } from "./types";

function toStampMs(value: number): number {
  return value < 1_000_000_000_000 ? value * 1000 : value;
}

export function mapMassiveBarsToCandles(bars: MassiveCandleBar[]): Candle[] {
  const candles = bars
    .filter((bar) => Number.isFinite(bar.t))
    .map((bar) => ({
      stamp: toStampMs(bar.t),
      o: bar.o,
      h: bar.h,
      l: bar.l,
      c: bar.c,
      v: bar.v ?? 0,
    }));

  return candles.sort((a, b) => a.stamp - b.stamp);
}
