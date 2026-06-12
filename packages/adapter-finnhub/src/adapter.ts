import {
  Candle,
  DataAdapter,
  LoadDataOptions,
  Tick,
} from "@efixdata/exeria-chart";
import { FinnhubApiClient } from "./api-client";
import { toFinnhubSymbol } from "./symbol";
import type { FinnhubAdapterConfig } from "./types";
import { FinnhubWebSocketClient } from "./websocket-client";

export class FinnhubAdapter implements DataAdapter {
  private apiClient: FinnhubApiClient;
  private wsClient: FinnhubWebSocketClient;
  private config: FinnhubAdapterConfig;
  private pollIntervalMs: number;
  private currentSubscriptions: Map<string, () => void> = new Map();
  private priceUpdateCallbacks: Map<string, Set<(update: Tick) => void>> =
    new Map();
  private lastPrice: Map<string, Tick> = new Map();

  constructor(config: FinnhubAdapterConfig) {
    if (!config.apiKey) {
      throw new Error("FinnhubAdapter requires apiKey in config");
    }

    this.config = config;
    this.pollIntervalMs = config.pollIntervalMs ?? 3000;
    this.apiClient = new FinnhubApiClient(config);
    this.wsClient = new FinnhubWebSocketClient(config);

    this.wsClient.onError((error) => {
      this.config.onError?.(error);
      console.error("Finnhub WebSocket error:", error);
    });
  }

  async initialize(_config: Record<string, unknown>): Promise<void> {
    // Finnhub does not require a separate bootstrap call for v1.
  }

  async getHistoricalData(
    symbol: string,
    options: LoadDataOptions,
  ): Promise<Candle[]> {
    return this.apiClient.getCandles({
      symbol,
      interval: options.interval,
      ...(options.limit !== undefined ? { limit: options.limit } : {}),
      ...(options.from ? { from: options.from } : {}),
      ...(options.to ? { to: options.to } : {}),
    });
  }

  async getCurrentPrice(symbol: string): Promise<Tick> {
    const cached = this.lastPrice.get(symbol);
    if (cached) {
      return cached;
    }

    const tick = await this.apiClient.getLatestPrice(symbol);
    this.lastPrice.set(symbol, tick);
    return tick;
  }

  subscribeToUpdates(
    symbol: string,
    callback: (update: Tick) => void,
  ): () => void {
    const key = toFinnhubSymbol(symbol, {
      ...(this.config.defaultForexExchange
        ? { defaultForexExchange: this.config.defaultForexExchange }
        : {}),
      ...(this.config.defaultCryptoExchange
        ? { defaultCryptoExchange: this.config.defaultCryptoExchange }
        : {}),
    });

    if (!this.priceUpdateCallbacks.has(key)) {
      this.priceUpdateCallbacks.set(key, new Set());

      const unsubscribe = this.wsClient.subscribe(symbol, (update) => {
        this.lastPrice.set(symbol, update);

        const callbacks = this.priceUpdateCallbacks.get(key);
        if (callbacks) {
          callbacks.forEach((cb) => cb(update));
        }
      });

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

export function createFinnhubAdapter(
  config: FinnhubAdapterConfig,
): FinnhubAdapter {
  return new FinnhubAdapter(config);
}
