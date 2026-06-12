import { CoinbaseApiClient } from "./api-client";
import { resolveExeriaInterval } from "./interval";
import { toCoinbaseProductId } from "./symbol";
import { CoinbaseWebSocketClient } from "./websocket-client";
import type { CoinbaseAdapterConfig } from "./types";
import type {
  Candle,
  DataAdapter,
  LoadDataOptions,
  Tick,
} from "@efixdata/exeria-chart";

export class CoinbaseAdapter implements DataAdapter {
  private apiClient: CoinbaseApiClient;
  private wsClient: CoinbaseWebSocketClient;
  private config: CoinbaseAdapterConfig;
  private currentSubscriptions: Map<string, () => void> = new Map();
  private pollingTimers: Map<string, ReturnType<typeof setInterval>> = new Map();
  private priceUpdateCallbacks: Map<string, Set<(update: Tick) => void>> =
    new Map();
  private lastPrice: Map<string, Tick> = new Map();
  private pollingIntervalMs: number;
  private useWebSocket: boolean;

  constructor(config: CoinbaseAdapterConfig = {}) {
    this.config = config;
    this.apiClient = new CoinbaseApiClient(config);
    this.wsClient = new CoinbaseWebSocketClient(config);
    this.pollingIntervalMs = config.pollingIntervalMs ?? 5000;
    this.useWebSocket = config.useWebSocket ?? true;

    this.wsClient.onError((error) => {
      this.config.onError?.(error);
    });
  }

  async initialize(_config: Record<string, unknown>): Promise<void> {
    // Coinbase public market data does not require API keys.
  }

  async getHistoricalData(
    symbol: string,
    options: LoadDataOptions,
  ): Promise<Candle[]> {
    const interval = resolveExeriaInterval(options.interval);
    const productId = toCoinbaseProductId(symbol);

    return this.apiClient.getCandles({
      symbol: productId,
      interval,
      ...(options.from ? { startTime: options.from.getTime() } : {}),
      ...(options.to ? { endTime: options.to.getTime() } : {}),
      ...(options.limit !== undefined ? { limit: options.limit } : {}),
    });
  }

  async getCurrentPrice(symbol: string): Promise<Tick> {
    const productId = toCoinbaseProductId(symbol);
    const cached = this.lastPrice.get(productId);
    if (cached) {
      return cached;
    }

    const tick = await this.apiClient.getLatestPrice(productId);
    this.lastPrice.set(productId, tick);
    return tick;
  }

  subscribeToUpdates(
    symbol: string,
    callback: (update: Tick) => void,
  ): () => void {
    const productId = toCoinbaseProductId(symbol);
    const key = productId;

    if (!this.priceUpdateCallbacks.has(key)) {
      this.priceUpdateCallbacks.set(key, new Set());

      const unsubscribe = this.useWebSocket
        ? this.wsClient.subscribe(productId, (update) => {
            this.lastPrice.set(productId, update);

            const callbacks = this.priceUpdateCallbacks.get(key);
            if (callbacks) {
              callbacks.forEach((cb) => cb(update));
            }
          })
        : this.startPolling(productId, key);

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

  private startPolling(productId: string, key: string): () => void {
    const poll = async () => {
      try {
        const update = await this.apiClient.getLatestPrice(productId);
        this.lastPrice.set(productId, update);

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
