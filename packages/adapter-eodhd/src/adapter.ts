import {
  Candle,
  DataAdapter,
  LoadDataOptions,
  Tick,
} from "@efixdata/exeria-chart";
import { EodhdApiClient } from "./api-client";
import { toEodhdSymbol } from "./symbol";
import type { EodhdAdapterConfig } from "./types";

export class EodhdAdapter implements DataAdapter {
  private apiClient: EodhdApiClient;
  private config: EodhdAdapterConfig;
  private pollIntervalMs: number;
  private pollTimers: Map<string, ReturnType<typeof setInterval>> = new Map();
  private priceUpdateCallbacks: Map<string, Set<(update: Tick) => void>> =
    new Map();
  private lastPrice: Map<string, Tick> = new Map();

  constructor(config: EodhdAdapterConfig) {
    if (!config.apiKey) {
      throw new Error("EodhdAdapter requires apiKey in config");
    }

    this.config = config;
    this.pollIntervalMs = config.pollIntervalMs ?? 5000;
    this.apiClient = new EodhdApiClient(config);
  }

  async initialize(_config: Record<string, unknown>): Promise<void> {
    // EODHD does not require a separate bootstrap call.
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
    const key = toEodhdSymbol(symbol, {
      ...(this.config.defaultStockExchange
        ? { defaultStockExchange: this.config.defaultStockExchange }
        : {}),
    });

    if (!this.priceUpdateCallbacks.has(key)) {
      this.priceUpdateCallbacks.set(key, new Set());
      this.startPolling(symbol, key);
    }

    this.priceUpdateCallbacks.get(key)!.add(callback);

    return () => {
      const callbacks = this.priceUpdateCallbacks.get(key);
      if (!callbacks) {
        return;
      }

      callbacks.delete(callback);

      if (callbacks.size === 0) {
        this.stopPolling(key);
        this.priceUpdateCallbacks.delete(key);
      }
    };
  }

  async disconnect(): Promise<void> {
    for (const key of this.pollTimers.keys()) {
      this.stopPolling(key);
    }

    this.priceUpdateCallbacks.clear();
    this.lastPrice.clear();
  }

  private startPolling(symbol: string, key: string): void {
    const poll = async () => {
      try {
        const tick = await this.apiClient.getLatestPrice(symbol);
        this.lastPrice.set(symbol, tick);

        const callbacks = this.priceUpdateCallbacks.get(key);
        if (callbacks) {
          callbacks.forEach((cb) => cb(tick));
        }
      } catch (error) {
        this.config.onError?.(error);
        console.error("EODHD polling error:", error);
      }
    };

    void poll();

    const timer = setInterval(() => {
      void poll();
    }, this.pollIntervalMs);

    this.pollTimers.set(key, timer);
  }

  private stopPolling(key: string): void {
    const timer = this.pollTimers.get(key);
    if (timer) {
      clearInterval(timer);
      this.pollTimers.delete(key);
    }
  }
}

export function createEodhdAdapter(config: EodhdAdapterConfig): EodhdAdapter {
  return new EodhdAdapter(config);
}
