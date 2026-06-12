import type { Candle } from "@efixdata/exeria-chart";
import type { FinageAggregateBar } from "./types";

export function mapAggregateBarsToCandles(bars: FinageAggregateBar[]): Candle[] {
  const candles = bars.map((bar) => ({
    stamp: bar.t < 1_000_000_000_000 ? bar.t * 1000 : bar.t,
    o: bar.o,
    h: bar.h,
    l: bar.l,
    c: bar.c,
    v: bar.v ?? 0,
  }));

  return candles.sort((a, b) => a.stamp - b.stamp);
}
