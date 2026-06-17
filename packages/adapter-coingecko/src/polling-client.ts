import type { Tick } from "@efixdata/exeria-chart";
import { CoingeckoApiClient } from "./api-client";
import { normalizeCoinId } from "./symbol";

const DEFAULT_POLL_INTERVAL_MS = 60_000;

export class CoingeckoPollingClient {
  private pollIntervalMs: number;
  private vsCurrency: string;
  private timers: Map<string, ReturnType<typeof setInterval>> = new Map();
  private callbacks: Map<string, Set<(update: Tick) => void>> = new Map();
  private inFlight: Set<string> = new Set();

  constructor(
    private apiClient: CoingeckoApiClient,
    config: { pollIntervalMs?: number; vsCurrency?: string } = {},
  ) {
    this.pollIntervalMs = config.pollIntervalMs ?? DEFAULT_POLL_INTERVAL_MS;
    this.vsCurrency = config.vsCurrency || "usd";
  }

  subscribe(
    symbol: string,
    callback: (update: Tick) => void,
    onPrice?: (coinId: string, update: Tick) => void,
  ): () => void {
    const coinId = normalizeCoinId(symbol);

    if (!this.callbacks.has(coinId)) {
      this.callbacks.set(coinId, new Set());
      void this.pollCoin(coinId, onPrice);

      const timer = setInterval(() => {
        void this.pollCoin(coinId, onPrice);
      }, this.pollIntervalMs);

      this.timers.set(coinId, timer);
    }

    this.callbacks.get(coinId)!.add(callback);

    return () => {
      const listeners = this.callbacks.get(coinId);
      if (!listeners) {
        return;
      }

      listeners.delete(callback);

      if (listeners.size === 0) {
        const timer = this.timers.get(coinId);
        if (timer) {
          clearInterval(timer);
          this.timers.delete(coinId);
        }
        this.callbacks.delete(coinId);
        this.inFlight.delete(coinId);
      }
    };
  }

  disconnect(): void {
    this.timers.forEach((timer) => clearInterval(timer));
    this.timers.clear();
    this.callbacks.clear();
    this.inFlight.clear();
  }

  private async pollCoin(
    coinId: string,
    onPrice?: (coinId: string, update: Tick) => void,
  ): Promise<void> {
    if (this.inFlight.has(coinId)) {
      return;
    }

    this.inFlight.add(coinId);

    try {
      const data = await this.apiClient.getSimplePrice({
        coinIds: [coinId],
        vsCurrency: this.vsCurrency,
      });

      const entry = data[coinId];
      const price = entry?.[this.vsCurrency];

      if (!entry || price === undefined) {
        throw new Error(`No price data found for symbol: ${coinId}`);
      }

      const stamp =
        entry.last_updated_at !== undefined
          ? entry.last_updated_at * 1000
          : Date.now();

      const update: Tick = {
        stamp,
        c: price,
        price,
      };

      onPrice?.(coinId, update);

      const listeners = this.callbacks.get(coinId);
      if (listeners) {
        listeners.forEach((cb) => cb(update));
      }
    } catch (error) {
      console.error(`CoinGecko polling error for ${coinId}:`, error);
    } finally {
      this.inFlight.delete(coinId);
    }
  }
}
