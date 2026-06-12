import {
  Candle,
  DataAdapter,
  LoadDataOptions,
  Tick,
} from "@efixdata/exeria-chart";
import type { Exchange } from "ccxt";
import { createCcxtExchange } from "./exchange-factory";
import { resolveCcxtTimeframe } from "./interval";
import { mapOhlcvToCandles, mapTickerToTick } from "./ohlcv";
import { startTickerPolling } from "./polling";
import { toCcxtSymbol } from "./symbol";
import type { CcxtAdapterConfig } from "./types";

export class CcxtAdapter implements DataAdapter {
  private exchange: Exchange;
  private config: CcxtAdapterConfig;
  private marketsLoaded = false;
  private currentInterval = "1h";
  private pollStops: Map<string, () => void> = new Map();
  private priceUpdateCallbacks: Map<string, Set<(update: Tick) => void>> =
    new Map();
  private lastPrice: Map<string, Tick> = new Map();

  constructor(config: CcxtAdapterConfig) {
    if (!config.exchangeId) {
      throw new Error("CcxtAdapter requires exchangeId in config");
    }

    this.config = {
      pollIntervalMs: 2000,
      enableRateLimit: true,
      ...config,
    };
    this.exchange = createCcxtExchange(this.config);
  }

  async initialize(_config: Record<string, unknown>): Promise<void> {
    await this.ensureMarketsLoaded();
  }

  async getHistoricalData(
    symbol: string,
    options: LoadDataOptions,
  ): Promise<Candle[]> {
    await this.ensureMarketsLoaded();

    const timeframe = resolveCcxtTimeframe(options.interval);
    this.currentInterval = timeframe;

    const unifiedSymbol = toCcxtSymbol(symbol, this.exchange);
    const since = options.from?.getTime();
    const limit = options.limit;

    const ohlcv = await this.exchange.fetchOHLCV(
      unifiedSymbol,
      timeframe,
      since,
      limit,
    );

    return mapOhlcvToCandles(ohlcv);
  }

  async getCurrentPrice(symbol: string): Promise<Tick> {
    const cached = this.lastPrice.get(symbol);
    if (cached) {
      return cached;
    }

    await this.ensureMarketsLoaded();

    const unifiedSymbol = toCcxtSymbol(symbol, this.exchange);
    const ticker = await this.exchange.fetchTicker(unifiedSymbol);
    const tick = mapTickerToTick(ticker);

    this.lastPrice.set(symbol, tick);
    return tick;
  }

  subscribeToUpdates(
    symbol: string,
    callback: (update: Tick) => void,
  ): () => void {
    const key = symbol;

    if (!this.priceUpdateCallbacks.has(key)) {
      this.priceUpdateCallbacks.set(key, new Set());

      const stopPolling = startTickerPolling(
        this.exchange,
        symbol,
        this.config.pollIntervalMs ?? 2000,
        (update) => {
          this.lastPrice.set(symbol, update);

          const callbacks = this.priceUpdateCallbacks.get(key);
          if (callbacks) {
            callbacks.forEach((cb) => cb(update));
          }
        },
        this.config.onError,
      );

      this.pollStops.set(key, stopPolling);
    }

    this.priceUpdateCallbacks.get(key)!.add(callback);

    return () => {
      const callbacks = this.priceUpdateCallbacks.get(key);
      if (!callbacks) {
        return;
      }

      callbacks.delete(callback);

      if (callbacks.size === 0) {
        const stopPolling = this.pollStops.get(key);
        if (stopPolling) {
          stopPolling();
          this.pollStops.delete(key);
        }
        this.priceUpdateCallbacks.delete(key);
      }
    };
  }

  async disconnect(): Promise<void> {
    this.pollStops.forEach((stop) => stop());
    this.pollStops.clear();
    this.priceUpdateCallbacks.clear();
    this.lastPrice.clear();

    if (typeof this.exchange.close === "function") {
      await this.exchange.close();
    }
  }

  private async ensureMarketsLoaded(): Promise<void> {
    if (this.marketsLoaded) {
      return;
    }

    await this.exchange.loadMarkets();
    this.marketsLoaded = true;
  }
}

export function createCcxtAdapter(config: CcxtAdapterConfig): CcxtAdapter {
  return new CcxtAdapter(config);
}
