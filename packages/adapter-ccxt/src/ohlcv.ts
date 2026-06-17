import type { Candle, Tick } from "@efixdata/exeria-chart";
import type { OHLCV, Ticker } from "ccxt";

export function mapOhlcvToCandles(ohlcv: OHLCV[]): Candle[] {
  return ohlcv.map(([stamp, o, h, l, c, v]) => ({
    stamp: stamp ?? 0,
    o: o ?? 0,
    h: h ?? 0,
    l: l ?? 0,
    c: c ?? 0,
    v: v ?? 0,
  }));
}

export function mapTickerToTick(ticker: Ticker): Tick {
  const price = ticker.last ?? ticker.close ?? ticker.bid ?? ticker.ask ?? 0;
  const stamp = ticker.timestamp ?? Date.now();

  return {
    stamp,
    c: price,
    price,
  };
}
