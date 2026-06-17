import {
  Candle,
  DataAdapter,
  LoadDataOptions,
  Tick,
} from "@efixdata/exeria-chart";
import { TwelveDataApiClient } from "./api-client";
import { toTwelveDataSymbol } from "./symbol";
import type { TwelveDataAdapterConfig } from "./types";
import { TwelveDataWebSocketClient } from "./websocket-client";

function formatDateParam(date: Date): string {
  return date.toISOString().replace(/\.\d{3}Z$/, "");
}

export class TwelveDataAdapter implements DataAdapter {
  private apiClient: TwelveDataApiClient;
  private wsClient: TwelveDataWebSocketClient;
  private config: TwelveDataAdapterConfig;
  private currentSubscriptions: Map<string, () => void> = new Map();
  private priceUpdateCallbacks: Map<string, Set<(update: Tick) => void>> =
    new Map();
  private lastPrice: Map<string, Tick> = new Map();

  constructor(config: TwelveDataAdapterConfig) {
    if (!config.apiKey) {
      throw new Error("TwelveDataAdapter requires apiKey in config");
    }

    this.config = config;
    this.apiClient = new TwelveDataApiClient(config);
    this.wsClient = new TwelveDataWebSocketClient(config);

    this.wsClient.onError((error) => {
      this.config.onError?.(error);
      console.error("Twelve Data WebSocket error:", error);
    });
  }

  async initialize(_config: Record<string, unknown>): Promise<void> {
    // Twelve Data does not require a separate bootstrap call for v1.
  }

  async getHistoricalData(
    symbol: string,
    options: LoadDataOptions,
  ): Promise<Candle[]> {
    return this.apiClient.getTimeSeries({
      symbol,
      interval: options.interval,
      ...(options.limit !== undefined ? { outputsize: options.limit } : {}),
      ...(options.from ? { startDate: formatDateParam(options.from) } : {}),
      ...(options.to ? { endDate: formatDateParam(options.to) } : {}),
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
    const key = toTwelveDataSymbol(symbol);

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

export function createTwelveDataAdapter(
  config: TwelveDataAdapterConfig,
): TwelveDataAdapter {
  return new TwelveDataAdapter(config);
}
