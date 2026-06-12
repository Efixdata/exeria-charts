import {
  Candle,
  DataAdapter,
  LoadDataOptions,
  Tick,
} from "@efixdata/exeria-chart";
import { KucoinApiClient } from "./api-client";
import {
  isWsSupportedInterval,
  resolveExeriaInterval,
} from "./interval";
import { toKucoinSymbol } from "./symbol";
import { KucoinWebSocketClient } from "./websocket-client";
import { KucoinAdapterConfig } from "./types";

function klineRowToTick(candles: string[]): Tick {
  return {
    stamp: Number(candles[0] ?? 0) * 1000,
    o: parseFloat(candles[1] ?? "0"),
    c: parseFloat(candles[2] ?? "0"),
    h: parseFloat(candles[3] ?? "0"),
    l: parseFloat(candles[4] ?? "0"),
    price: parseFloat(candles[2] ?? "0"),
    v: parseFloat(candles[5] ?? "0"),
  };
}

export class KucoinAdapter implements DataAdapter {
  private apiClient: KucoinApiClient;
  private wsClient: KucoinWebSocketClient;
  private currentSubscriptions: Map<string, () => void> = new Map();
  private pollingTimers: Map<string, ReturnType<typeof setInterval>> = new Map();
  private currentSymbol = "";
  private currentInterval = "1h";
  private priceUpdateCallbacks: Map<string, Set<(update: Tick) => void>> =
    new Map();
  private lastPrice: Map<string, Tick> = new Map();
  private pollingIntervalMs: number;

  constructor(config: KucoinAdapterConfig = {}) {
    this.apiClient = new KucoinApiClient(config);
    this.wsClient = new KucoinWebSocketClient(config, () =>
      this.apiClient.getPublicWsToken(),
    );
    this.pollingIntervalMs = config.pollingIntervalMs ?? 30_000;

    this.wsClient.onError((error) => {
      console.error("KuCoin WebSocket error:", error);
    });
  }

  async initialize(_config: Record<string, unknown>): Promise<void> {
    // KuCoin public market data does not require API keys.
  }

  async getHistoricalData(
    symbol: string,
    options: LoadDataOptions,
  ): Promise<Candle[]> {
    const exeriaInterval = resolveExeriaInterval(options.interval);
    const kucoinSymbol = toKucoinSymbol(symbol);

    this.currentSymbol = kucoinSymbol;
    this.currentInterval = exeriaInterval;

    const candles = await this.apiClient.getKlines({
      symbol: kucoinSymbol,
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
    const kucoinSymbol = toKucoinSymbol(symbol);
    const cached = this.lastPrice.get(kucoinSymbol);
    if (cached) {
      return cached;
    }

    const ticker = await this.apiClient.getTickerPrice(kucoinSymbol);
    const tick: Tick = {
      stamp: ticker.stamp,
      c: parseFloat(ticker.price),
      price: parseFloat(ticker.price),
    };

    this.lastPrice.set(kucoinSymbol, tick);
    return tick;
  }

  subscribeToUpdates(
    symbol: string,
    callback: (update: Tick) => void,
  ): () => void {
    const kucoinSymbol = toKucoinSymbol(symbol);
    const key = kucoinSymbol;

    if (!this.priceUpdateCallbacks.has(key)) {
      this.priceUpdateCallbacks.set(key, new Set());

      const unsubscribe = isWsSupportedInterval(this.currentInterval)
        ? this.wsClient.subscribe(
            kucoinSymbol,
            this.currentInterval,
            (row) => {
              const update = klineRowToTick(row);
              this.lastPrice.set(kucoinSymbol, update);

              const callbacks = this.priceUpdateCallbacks.get(key);
              if (callbacks) {
                callbacks.forEach((cb) => cb(update));
              }
            },
          )
        : this.startPolling(kucoinSymbol, key);

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
    this.pollingTimers.forEach((timer) => clearInterval(timer));
    this.pollingTimers.clear();
    this.wsClient.disconnect();
  }

  private startPolling(
    kucoinSymbol: string,
    key: string,
  ): () => void {
    const poll = async () => {
      try {
        const ticker = await this.apiClient.getTickerPrice(kucoinSymbol);
        const update: Tick = {
          stamp: ticker.stamp,
          c: parseFloat(ticker.price),
          price: parseFloat(ticker.price),
        };

        this.lastPrice.set(kucoinSymbol, update);

        const callbacks = this.priceUpdateCallbacks.get(key);
        if (callbacks) {
          callbacks.forEach((cb) => cb(update));
        }
      } catch (error) {
        console.error("KuCoin polling error:", error);
      }
    };

    void poll();
    const timer = setInterval(() => {
      void poll();
    }, this.pollingIntervalMs);
    this.pollingTimers.set(key, timer);

    return () => {
      clearInterval(timer);
      this.pollingTimers.delete(key);
    };
  }
}
