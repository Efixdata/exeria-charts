import {
  Candle,
  DataAdapter,
  LoadDataOptions,
  Tick,
} from "@efixdata/exeria-chart";
import { KrakenApiClient } from "./api-client";
import { resolveExeriaInterval } from "./interval";
import { toKrakenWsPair } from "./symbol";
import { KrakenWebSocketClient } from "./websocket-client";
import { KrakenAdapterConfig, KrakenOhlcStreamCandle } from "./types";

function streamCandleToTick(candle: KrakenOhlcStreamCandle): Tick {
  return {
    stamp: Date.parse(candle.interval_begin),
    o: candle.open,
    h: candle.high,
    l: candle.low,
    c: candle.close,
    price: candle.close,
    v: candle.volume,
  };
}

export class KrakenAdapter implements DataAdapter {
  private apiClient: KrakenApiClient;
  private wsClient: KrakenWebSocketClient;
  private currentSubscriptions: Map<string, () => void> = new Map();
  private currentSymbol = "";
  private currentInterval = "1h";
  private priceUpdateCallbacks: Map<string, Set<(update: Tick) => void>> =
    new Map();
  private lastPrice: Map<string, Tick> = new Map();

  constructor(config: KrakenAdapterConfig = {}) {
    this.apiClient = new KrakenApiClient(config);
    this.wsClient = new KrakenWebSocketClient(config);

    this.wsClient.onError((error) => {
      console.error("Kraken WebSocket error:", error);
    });
  }

  async initialize(_config: Record<string, unknown>): Promise<void> {
    // Kraken public market data does not require API keys.
  }

  async getHistoricalData(
    symbol: string,
    options: LoadDataOptions,
  ): Promise<Candle[]> {
    const exeriaInterval = resolveExeriaInterval(options.interval);
    const wsSymbol = toKrakenWsPair(symbol);
    this.currentSymbol = wsSymbol;
    this.currentInterval = exeriaInterval;

    const candles = await this.apiClient.getOhlc({
      symbol,
      interval: exeriaInterval,
      ...(options.from ? { startTime: options.from.getTime() } : {}),
      ...(options.to ? { endTime: options.to.getTime() } : {}),
      ...(options.limit !== undefined ? { limit: options.limit } : {}),
    });

    return candles.map((candle) => ({
      stamp: candle.startTime,
      o: parseFloat(candle.open),
      h: parseFloat(candle.high),
      l: parseFloat(candle.low),
      c: parseFloat(candle.close),
      v: parseFloat(candle.volume),
    }));
  }

  async getCurrentPrice(symbol: string): Promise<Tick> {
    const wsSymbol = toKrakenWsPair(symbol);
    const cached = this.lastPrice.get(wsSymbol);
    if (cached) {
      return cached;
    }

    const latest = await this.apiClient.getTickerPrice(symbol);

    const tick: Tick = {
      stamp: latest.stamp,
      c: parseFloat(latest.price),
      price: parseFloat(latest.price),
    };

    this.lastPrice.set(wsSymbol, tick);
    return tick;
  }

  subscribeToUpdates(
    symbol: string,
    callback: (update: Tick) => void,
  ): () => void {
    const wsSymbol = toKrakenWsPair(symbol);
    const key = wsSymbol;

    if (!this.priceUpdateCallbacks.has(key)) {
      this.priceUpdateCallbacks.set(key, new Set());

      const unsubscribe = this.wsClient.subscribe(
        symbol,
        this.currentInterval,
        (stream) => {
          const update = streamCandleToTick(stream);

          this.lastPrice.set(wsSymbol, update);

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
      if (!callbacks) {
        return;
      }

      callbacks.delete(callback);

      if (callbacks.size === 0) {
        const unsubscribe = this.currentSubscriptions.get(key);
        if (unsubscribe) {
          unsubscribe();
          this.currentSubscriptions.delete(key);
          this.priceUpdateCallbacks.delete(key);
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
