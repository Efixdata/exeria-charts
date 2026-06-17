import {
  Candle,
  DataAdapter,
  LoadDataOptions,
  Tick,
} from "@efixdata/exeria-chart";
import { CoingeckoApiClient } from "./api-client";
import { resolveExeriaInterval } from "./interval";
import { CoingeckoPollingClient } from "./polling-client";
import { normalizeCoinId } from "./symbol";
import { CoingeckoAdapterConfig } from "./types";

export class CoingeckoAdapter implements DataAdapter {
  private apiClient: CoingeckoApiClient;
  private pollingClient: CoingeckoPollingClient;
  private vsCurrency: string;
  private priceUpdateCallbacks: Map<string, Set<(update: Tick) => void>> =
    new Map();
  private currentSubscriptions: Map<string, () => void> = new Map();
  private lastPrice: Map<string, Tick> = new Map();

  constructor(config: CoingeckoAdapterConfig = {}) {
    this.vsCurrency = config.vsCurrency || "usd";
    this.apiClient = new CoingeckoApiClient(config);
    this.pollingClient = new CoingeckoPollingClient(this.apiClient, {
      vsCurrency: this.vsCurrency,
      ...(config.pollIntervalMs !== undefined
        ? { pollIntervalMs: config.pollIntervalMs }
        : {}),
    });
  }

  async initialize(config: Record<string, unknown>): Promise<void> {
    const apiKey =
      typeof config.apiKey === "string" ? config.apiKey : undefined;

    if (apiKey) {
      this.apiClient.setApiKey(apiKey);
    }
  }

  async getHistoricalData(
    symbol: string,
    options: LoadDataOptions,
  ): Promise<Candle[]> {
    const coinId = normalizeCoinId(symbol);
    const exeriaInterval = resolveExeriaInterval(options.interval);

    const candles = await this.apiClient.getHistoricalCandles({
      coinId,
      interval: exeriaInterval,
      vsCurrency: this.vsCurrency,
      ...(options.from ? { from: options.from } : {}),
      ...(options.to ? { to: options.to } : {}),
      ...(options.limit !== undefined ? { limit: options.limit } : {}),
    });

    return candles.map((candle) => ({
      stamp: candle.stamp,
      o: candle.open,
      h: candle.high,
      l: candle.low,
      c: candle.close,
      v: candle.volume,
    }));
  }

  async getCurrentPrice(symbol: string): Promise<Tick> {
    const coinId = normalizeCoinId(symbol);
    const cached = this.lastPrice.get(coinId);
    if (cached) {
      return cached;
    }

    const data = await this.apiClient.getSimplePrice({
      coinIds: [coinId],
      vsCurrency: this.vsCurrency,
    });

    const entry = data[coinId];
    const price = entry?.[this.vsCurrency];

    if (!entry || price === undefined) {
      throw new Error(`No price data found for symbol: ${coinId}`);
    }

    const tick: Tick = {
      stamp:
        entry.last_updated_at !== undefined
          ? entry.last_updated_at * 1000
          : Date.now(),
      c: price,
      price,
    };

    this.lastPrice.set(coinId, tick);
    return tick;
  }

  subscribeToUpdates(
    symbol: string,
    callback: (update: Tick) => void,
  ): () => void {
    const coinId = normalizeCoinId(symbol);

    if (!this.priceUpdateCallbacks.has(coinId)) {
      this.priceUpdateCallbacks.set(coinId, new Set());

      const unsubscribe = this.pollingClient.subscribe(
        coinId,
        (update) => {
          const callbacks = this.priceUpdateCallbacks.get(coinId);
          if (callbacks) {
            callbacks.forEach((cb) => cb(update));
          }
        },
        (id, update) => {
          this.lastPrice.set(id, update);
        },
      );

      this.currentSubscriptions.set(coinId, unsubscribe);
    }

    this.priceUpdateCallbacks.get(coinId)!.add(callback);

    return () => {
      const callbacks = this.priceUpdateCallbacks.get(coinId);
      if (!callbacks) {
        return;
      }

      callbacks.delete(callback);

      if (callbacks.size === 0) {
        const unsubscribe = this.currentSubscriptions.get(coinId);
        if (unsubscribe) {
          unsubscribe();
          this.currentSubscriptions.delete(coinId);
          this.priceUpdateCallbacks.delete(coinId);
        }
      }
    };
  }

  async disconnect(): Promise<void> {
    this.currentSubscriptions.forEach((unsubscribe) => unsubscribe());
    this.currentSubscriptions.clear();
    this.priceUpdateCallbacks.clear();
    this.lastPrice.clear();
    this.pollingClient.disconnect();
  }
}
