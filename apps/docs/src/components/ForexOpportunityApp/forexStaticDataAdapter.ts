import type { Candle, DataAdapter, LoadDataOptions, Tick } from "@efixdata/exeria-chart";
import {
  intervalToForexTimeframeId,
  loadStaticForexCandles,
} from "./forexStaticData";

function candleToTick(candle: Candle): Tick {
  return {
    stamp: candle.stamp,
    o: candle.o,
    h: candle.h,
    l: candle.l,
    c: candle.c,
    price: candle.c,
    ...(typeof candle.v === "number" ? { v: candle.v } : {}),
  };
}

export class ForexStaticDataAdapter implements DataAdapter {
  private lastTicks = new Map<string, Tick>();

  async initialize(_config: Record<string, unknown>): Promise<void> {}

  async getHistoricalData(symbol: string, options: LoadDataOptions): Promise<Candle[]> {
    const timeframeId = intervalToForexTimeframeId(options.interval);
    const candles = await loadStaticForexCandles(symbol, timeframeId, options.limit);
    const last = candles.at(-1);

    if (last) {
      this.lastTicks.set(symbol, candleToTick(last));
    }

    return candles;
  }

  async getCurrentPrice(symbol: string): Promise<Tick> {
    const cached = this.lastTicks.get(symbol);
    if (cached) {
      return cached;
    }

    const candles = await loadStaticForexCandles(symbol, "h1", 1);
    const last = candles.at(-1);
    if (!last) {
      throw new Error(`No static price for ${symbol}`);
    }

    const tick = candleToTick(last);
    this.lastTicks.set(symbol, tick);
    return tick;
  }

  subscribeToUpdates(_symbol: string, _callback: (update: Tick) => void): () => void {
    return () => {};
  }

  async disconnect(): Promise<void> {
    this.lastTicks.clear();
  }
}
