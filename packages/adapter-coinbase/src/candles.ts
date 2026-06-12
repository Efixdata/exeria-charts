import type { Candle } from "@efixdata/exeria-chart";
import type { CoinbaseCandleBar } from "./types";

export function mapCoinbaseBarsToCandles(bars: CoinbaseCandleBar[]): Candle[] {
  const candles = bars
    .filter((bar) => bar.start)
    .map((bar) => ({
      stamp: Number(bar.start) * 1000,
      o: parseFloat(bar.open),
      h: parseFloat(bar.high),
      l: parseFloat(bar.low),
      c: parseFloat(bar.close),
      v: parseFloat(bar.volume),
    }));

  return candles.sort((a, b) => a.stamp - b.stamp);
}
