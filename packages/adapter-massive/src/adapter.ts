import { MassiveApiClient } from "./api-client";
import { resolveExeriaInterval } from "./interval";
import { toMassiveTicker } from "./symbol";
import { MassiveWebSocketClient } from "./websocket-client";
import type { MassiveAdapterConfig } from "./types";
import type {
  Candle,
  DataAdapter,
  LoadDataOptions,
  Tick,
} from "@efixdata/exeria-chart";

export class MassiveAdapter implements DataAdapter {
  private apiClient: MassiveApiClient;
  private wsClient: MassiveWebSocketClient;
  private config: MassiveAdapterConfig;
  private pollIntervalMs: number;
  private currentSubscriptions: Map<string, () => void> = new Map();
  private priceUpdateCallbacks: Map<string, Set<(update: Tick) => void>> =
    new Map();
  private lastPrice: Map<string, Tick> = new Map();

  constructor(config: MassiveAdapterConfig) {
    if (!config.apiKey) {
      throw new Error("MassiveAdapter requires apiKey in config");
    }

    this.config = config;
    this.pollIntervalMs = config.pollIntervalMs ?? 5000;
    this.apiClient = new MassiveApiClient(config);
    this.wsClient = new MassiveWebSocketClient(config);
  }

  async initialize(_config: Record<string, unknown>): Promise<void> {
    // Massive REST/WS auth uses the API key from constructor config.
  }

  async getHistoricalData(
    symbol: string,
    options: LoadDataOptions,
  ): Promise<Candle[]> {
    const interval = resolveExeriaInterval(options.interval);

    try {
      return await this.apiClient.getAggregates({
        symbol,
        interval,
        ...(options.limit !== undefined ? { limit: options.limit } : {}),
        ...(options.from ? { from: options.from } : {}),
        ...(options.to ? { to: options.to } : {}),
      });
    } catch (error) {
      this.config.onError?.(error);
      throw error;
    }
  }

  async getCurrentPrice(symbol: string): Promise<Tick> {
    const cached = this.lastPrice.get(symbol);
    if (cached) {
      return cached;
    }

    try {
      const tick = await this.apiClient.getPreviousClose(symbol);
      this.lastPrice.set(symbol, tick);
      return tick;
    } catch (error) {
      this.config.onError?.(error);
      throw error;
    }
  }

  subscribeToUpdates(
    symbol: string,
    callback: (update: Tick) => void,
  ): () => void {
    const key = toMassiveTicker(symbol);

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
