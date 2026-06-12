import {
  Candle,
  DataAdapter,
  LoadDataOptions,
  Tick,
} from "@efixdata/exeria-chart";
import { BybitApiClient } from "./api-client";
import { resolveExeriaInterval } from "./interval";
import { BybitWebSocketClient } from "./websocket-client";
import { BybitAdapterConfig } from "./types";

export class BybitAdapter implements DataAdapter {
  private apiClient: BybitApiClient;
  private wsClient: BybitWebSocketClient;
  private currentSubscriptions: Map<string, () => void> = new Map();
  private currentSymbol = "";
  private currentInterval = "1h";
  private priceUpdateCallbacks: Map<string, Set<(update: Tick) => void>> =
    new Map();
  private lastPrice: Map<string, Tick> = new Map();

  constructor(config: BybitAdapterConfig = {}) {
    this.apiClient = new BybitApiClient(config);
    this.wsClient = new BybitWebSocketClient(config);

    this.wsClient.onError((error) => {
      console.error("Bybit WebSocket error:", error);
    });
  }

  async initialize(_config: Record<string, unknown>): Promise<void> {
    // Bybit public market data does not require API keys.
  }

  async getHistoricalData(
    symbol: string,
    options: LoadDataOptions,
  ): Promise<Candle[]> {
    const exeriaInterval = resolveExeriaInterval(options.interval);
    this.currentSymbol = symbol;
    this.currentInterval = exeriaInterval;

    const klines = await this.apiClient.getKlines({
      symbol: symbol.toUpperCase(),
      interval: exeriaInterval,
      ...(options.from ? { startTime: options.from.getTime() } : {}),
      ...(options.to ? { endTime: options.to.getTime() } : {}),
      ...(options.limit !== undefined ? { limit: options.limit } : {}),
    });

    return klines.map((kline) => ({
      stamp: kline.startTime,
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

    const kline = klines[klines.length - 1];
    if (!kline) {
      throw new Error(`No price data found for symbol: ${symbol}`);
    }

    const tick: Tick = {
      stamp: kline.startTime,
      c: parseFloat(kline.close),
      price: parseFloat(kline.close),
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
        (stream) => {
          const update: Tick = {
            stamp: stream.start,
            o: parseFloat(stream.open),
            h: parseFloat(stream.high),
            l: parseFloat(stream.low),
            c: parseFloat(stream.close),
            price: parseFloat(stream.close),
            v: parseFloat(stream.volume),
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
