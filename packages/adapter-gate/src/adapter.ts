import { GateApiClient } from "./api-client";
import { isWsSupportedInterval, resolveExeriaInterval } from "./interval";
import { toGateCurrencyPair } from "./symbol";
import { GateWebSocketClient } from "./websocket-client";
import type { GateAdapterConfig } from "./types";
import type {
  Candle,
  DataAdapter,
  LoadDataOptions,
  Tick,
} from "@efixdata/exeria-chart";

export class GateAdapter implements DataAdapter {
  private apiClient: GateApiClient;
  private wsClient: GateWebSocketClient;
  private config: GateAdapterConfig;
  private currentSubscriptions: Map<string, () => void> = new Map();
  private pollingTimers: Map<string, ReturnType<typeof setInterval>> = new Map();
  private priceUpdateCallbacks: Map<string, Set<(update: Tick) => void>> =
    new Map();
  private lastPrice: Map<string, Tick> = new Map();
  private currentInterval = "1h";
  private pollingIntervalMs: number;
  private useWebSocket: boolean;

  constructor(config: GateAdapterConfig = {}) {
    this.config = config;
    this.apiClient = new GateApiClient(config);
    this.wsClient = new GateWebSocketClient(config);
    this.pollingIntervalMs = config.pollingIntervalMs ?? 5000;
    this.useWebSocket = config.useWebSocket ?? true;

    this.wsClient.onError((error) => {
      this.config.onError?.(error);
    });
  }

  async initialize(_config: Record<string, unknown>): Promise<void> {
    // Gate.io public market data does not require API keys.
  }

  async getHistoricalData(
    symbol: string,
    options: LoadDataOptions,
  ): Promise<Candle[]> {
    const interval = resolveExeriaInterval(options.interval);
    this.currentInterval = interval;

    return this.apiClient.getCandles({
      symbol,
      interval,
      ...(options.from ? { startTime: options.from.getTime() } : {}),
      ...(options.to ? { endTime: options.to.getTime() } : {}),
      ...(options.limit !== undefined ? { limit: options.limit } : {}),
    });
  }

  async getCurrentPrice(symbol: string): Promise<Tick> {
    const currencyPair = toGateCurrencyPair(symbol);
    const cached = this.lastPrice.get(currencyPair);
    if (cached) {
      return cached;
    }

    const tick = await this.apiClient.getLatestPrice(symbol);
    this.lastPrice.set(currencyPair, tick);
    return tick;
  }

  subscribeToUpdates(
    symbol: string,
    callback: (update: Tick) => void,
  ): () => void {
    const currencyPair = toGateCurrencyPair(symbol);
    const key = currencyPair;

    if (!this.priceUpdateCallbacks.has(key)) {
      this.priceUpdateCallbacks.set(key, new Set());

      const unsubscribe = this.useWebSocket &&
        isWsSupportedInterval(this.currentInterval)
        ? this.wsClient.subscribe(symbol, this.currentInterval, (update) => {
            this.lastPrice.set(currencyPair, update);

            const callbacks = this.priceUpdateCallbacks.get(key);
            if (callbacks) {
              callbacks.forEach((cb) => cb(update));
            }
          })
        : this.startPolling(currencyPair, key);

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
    this.pollingTimers.forEach((timer) => clearInterval(timer));
    this.pollingTimers.clear();
    this.wsClient.disconnect();
  }

  private startPolling(currencyPair: string, key: string): () => void {
    const poll = async () => {
      try {
        const update = await this.apiClient.getLatestPrice(currencyPair);
        this.lastPrice.set(currencyPair, update);

        const callbacks = this.priceUpdateCallbacks.get(key);
        if (callbacks) {
          callbacks.forEach((cb) => cb(update));
        }
      } catch (error) {
        this.config.onError?.(error);
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
