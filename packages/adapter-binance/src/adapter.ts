import {
  Candle,
  DataAdapter,
  LoadDataOptions,
  Tick,
} from "@efixdata/exeria-chart";
import { BinanceApiClient } from "./api-client";
import { BinanceWebSocketClient } from "./websocket-client";
import { BinanceInterval, BinanceAdapterConfig, BinanceKlineStream } from "./types";

const DEFAULT_INTERVAL: BinanceInterval = "1h";

function resolveBinanceInterval(interval: string): BinanceInterval {
  if (!interval) {
    return DEFAULT_INTERVAL;
  }

  return interval as BinanceInterval;
}

export class BinanceAdapter implements DataAdapter {
  private apiClient: BinanceApiClient;
  private wsClient: BinanceWebSocketClient;
  private currentSubscriptions: Map<string, () => void> = new Map();
  private currentSymbol: string = "";
  private currentInterval: BinanceInterval = DEFAULT_INTERVAL;
  private priceUpdateCallbacks: Map<string, Set<(update: Tick) => void>> =
    new Map();
  private lastPrice: Map<string, Tick> = new Map();

  constructor(config: BinanceAdapterConfig = {}) {
    this.apiClient = new BinanceApiClient(config);
    this.wsClient = new BinanceWebSocketClient(config);

    this.wsClient.onError((error) => {
      console.error("Binance WebSocket error:", error);
    });
  }

  async initialize(_config: Record<string, unknown>): Promise<void> {
    // Binance adapter doesn't require any API keys.
  }

  async getHistoricalData(
    symbol: string,
    options: LoadDataOptions,
  ): Promise<Candle[]> {
    const binanceInterval = resolveBinanceInterval(options.interval);
    this.currentSymbol = symbol;
    this.currentInterval = binanceInterval;

    // @ts-ignore
    const klines = await this.apiClient.getKlines({
      symbol: symbol.toUpperCase(),
      interval: binanceInterval,
      startTime: options.from?.getTime(),
      endTime: options.to?.getTime(),
      limit: options.limit,
    });

    return klines.map((kline) => ({
      stamp: kline.openTime,
      o: parseFloat(kline.open),
      h: parseFloat(kline.high),
      l: parseFloat(kline.low),
      c: parseFloat(kline.close),
      v: parseFloat(kline.volume),
    }));
  }

  async getCurrentPrice(symbol: string): Promise<Tick> {
    const cached = this.lastPrice.get(symbol);
    if (cached) {
      return cached;
    }

    const klines = await this.apiClient.getKlines({
      symbol: symbol.toUpperCase(),
      interval: "1m",
      limit: 1,
    });

    if (klines.length === 0) {
      throw new Error(`No price data found for symbol: ${symbol}`);
    }

    const kline = klines[0];
    const tick: Tick = {
    // @ts-ignore
      stamp: kline.closeTime,
    // @ts-ignore
      c: parseFloat(kline.close),
    // @ts-ignore
      price: parseFloat(kline.close),
    // @ts-ignore
      v: parseFloat(kline.volume),
    };

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

      const unsubscribe = this.wsClient.subscribe(
        symbol,
        this.currentInterval,
        (stream: BinanceKlineStream) => {
          const update: Tick = {
            stamp: stream.k.t,
            o: parseFloat(stream.k.o),
            h: parseFloat(stream.k.h),
            l: parseFloat(stream.k.l),
            c: parseFloat(stream.k.c),
            price: parseFloat(stream.k.c),
            v: parseFloat(stream.k.v),
          };

          this.lastPrice.set(symbol, update);

          const callbacks = this.priceUpdateCallbacks.get(key);
          if (callbacks) {
            callbacks.forEach((cb) => cb(update));
          }
        },
      );

      this.currentSubscriptions.set(key, unsubscribe);
    }

    this.priceUpdateCallbacks.get(key)!.add(callback);

    return () => {
      const callbacks = this.priceUpdateCallbacks.get(key);
      if (callbacks) {
        callbacks.delete(callback);

        if (callbacks.size === 0) {
          const unsubscribe = this.currentSubscriptions.get(key);
          if (unsubscribe) {
            unsubscribe();
            this.currentSubscriptions.delete(key);
            this.priceUpdateCallbacks.delete(key);
          }
        }
      }
    };
  }

  async disconnect(): Promise<void> {
    this.currentSubscriptions.forEach((unsubscribe) => unsubscribe());
    this.currentSubscriptions.clear();
    this.priceUpdateCallbacks.clear();
    this.lastPrice.clear();
    this.wsClient.disconnect();
  }
}
