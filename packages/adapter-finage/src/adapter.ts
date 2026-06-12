import {
  Candle,
  DataAdapter,
  LoadDataOptions,
  Tick,
} from "@efixdata/exeria-chart";
import { FinageApiClient } from "./api-client";
import { toFinageSymbol } from "./symbol";
import type { FinageAdapterConfig } from "./types";
import {
  FinageWebSocketClient,
  resolveFinageWsUrl,
} from "./websocket-client";

function formatDateParam(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export class FinageAdapter implements DataAdapter {
  private apiClient: FinageApiClient;
  private wsClient: FinageWebSocketClient | null = null;
  private config: FinageAdapterConfig;
  private pollIntervalMs: number;
  private currentSubscriptions: Map<string, () => void> = new Map();
  private priceUpdateCallbacks: Map<string, Set<(update: Tick) => void>> =
    new Map();
  private lastPrice: Map<string, Tick> = new Map();

  constructor(config: FinageAdapterConfig) {
    if (!config.apiKey) {
      throw new Error("FinageAdapter requires apiKey in config");
    }

    this.config = config;
    this.pollIntervalMs = config.pollIntervalMs ?? 3000;
    this.apiClient = new FinageApiClient(config);

    if (resolveFinageWsUrl(config)) {
      this.wsClient = new FinageWebSocketClient(config);
      this.wsClient.onError((error) => {
        this.config.onError?.(error);
        console.error("Finage WebSocket error:", error);
      });
    }
  }

  async initialize(_config: Record<string, unknown>): Promise<void> {
    // Finage does not require a separate bootstrap call for v1.
  }

  async getHistoricalData(
    symbol: string,
    options: LoadDataOptions,
  ): Promise<Candle[]> {
    return this.apiClient.getAggregates({
      symbol,
      interval: options.interval,
      ...(options.limit !== undefined ? { limit: options.limit } : {}),
      ...(options.from ? { from: formatDateParam(options.from) } : {}),
      ...(options.to ? { to: formatDateParam(options.to) } : {}),
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
    const key = toFinageSymbol(symbol);

    if (!this.priceUpdateCallbacks.has(key)) {
      this.priceUpdateCallbacks.set(key, new Set());

      const unsubscribe = this.wsClient
        ? this.wsClient.subscribe(symbol, (update) => {
            this.lastPrice.set(symbol, update);

            const callbacks = this.priceUpdateCallbacks.get(key);
            if (callbacks) {
              callbacks.forEach((cb) => cb(update));
            }
          })
        : this.startPolling(symbol, key);

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

  private startPolling(symbol: string, key: string): () => void {
    let active = true;

    const poll = async () => {
      if (!active) {
        return;
      }

      try {
        const tick = await this.apiClient.getLatestPrice(symbol);
        this.lastPrice.set(symbol, tick);

        const callbacks = this.priceUpdateCallbacks.get(key);
        if (callbacks) {
          callbacks.forEach((cb) => cb(tick));
        }
      } catch (error) {
        this.config.onError?.(error);
      }
    };

    void poll();
    const timer = setInterval(() => {
      void poll();
    }, this.pollIntervalMs);

    return () => {
      active = false;
      clearInterval(timer);
    };
  }

  async disconnect(): Promise<void> {
    this.currentSubscriptions.forEach((unsubscribe) => unsubscribe());
    this.currentSubscriptions.clear();
    this.priceUpdateCallbacks.clear();
    this.lastPrice.clear();
    this.wsClient?.disconnect();
  }
}

export function createFinageAdapter(
  config: FinageAdapterConfig,
): FinageAdapter {
  return new FinageAdapter(config);
}
