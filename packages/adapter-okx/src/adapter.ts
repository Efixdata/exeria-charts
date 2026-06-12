import {
  Candle,
  DataAdapter,
  LoadDataOptions,
  Tick,
} from "@efixdata/exeria-chart";
import { OkxApiClient } from "./api-client";
import { resolveExeriaInterval } from "./interval";
import { toOkxInstId } from "./symbol";
import { OkxWebSocketClient } from "./websocket-client";
import { OkxAdapterConfig } from "./types";

function candleRowToTick(row: string[]): Tick {
  return {
    stamp: Number(row[0] ?? 0),
    o: parseFloat(row[1] ?? "0"),
    h: parseFloat(row[2] ?? "0"),
    l: parseFloat(row[3] ?? "0"),
    c: parseFloat(row[4] ?? "0"),
    price: parseFloat(row[4] ?? "0"),
    v: parseFloat(row[5] ?? "0"),
  };
}

export class OkxAdapter implements DataAdapter {
  private apiClient: OkxApiClient;
  private wsClient: OkxWebSocketClient;
  private currentSubscriptions: Map<string, () => void> = new Map();
  private currentSymbol = "";
  private currentInterval = "1h";
  private priceUpdateCallbacks: Map<string, Set<(update: Tick) => void>> =
    new Map();
  private lastPrice: Map<string, Tick> = new Map();

  constructor(config: OkxAdapterConfig = {}) {
    this.apiClient = new OkxApiClient(config);
    this.wsClient = new OkxWebSocketClient(config);

    this.wsClient.onError((error) => {
      console.error("OKX WebSocket error:", error);
    });
  }

  async initialize(_config: Record<string, unknown>): Promise<void> {
    // OKX public market data does not require API keys.
  }

  async getHistoricalData(
    symbol: string,
    options: LoadDataOptions,
  ): Promise<Candle[]> {
    const exeriaInterval = resolveExeriaInterval(options.interval);
    const instId = toOkxInstId(symbol);

    this.currentSymbol = instId;
    this.currentInterval = exeriaInterval;

    const candles = await this.apiClient.getCandles({
      symbol: instId,
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
    const instId = toOkxInstId(symbol);
    const cached = this.lastPrice.get(instId);
    if (cached) {
      return cached;
    }

    const candles = await this.apiClient.getCandles({
      symbol: instId,
      interval: "1m",
      limit: 1,
    });

    if (candles.length === 0) {
      throw new Error(`No price data found for symbol: ${instId}`);
    }

    const candle = candles[candles.length - 1];
    if (!candle) {
      throw new Error(`No price data found for symbol: ${instId}`);
    }

    const tick: Tick = {
      stamp: candle.startTime,
      c: parseFloat(candle.close),
      price: parseFloat(candle.close),
      v: parseFloat(candle.volume),
    };

    this.lastPrice.set(instId, tick);
    return tick;
  }

  subscribeToUpdates(
    symbol: string,
    callback: (update: Tick) => void,
  ): () => void {
    const instId = toOkxInstId(symbol);
    const key = instId;

    if (!this.priceUpdateCallbacks.has(key)) {
      this.priceUpdateCallbacks.set(key, new Set());

      const unsubscribe = this.wsClient.subscribe(
        instId,
        this.currentInterval,
        (row) => {
          const update = candleRowToTick(row);

          this.lastPrice.set(instId, update);

          const callbacks = this.priceUpdateCallbacks.get(key);
          if (callbacks) {
            callbacks.forEach((cb) => cb(update));
          }
        },
      );

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
    this.wsClient.disconnect();
  }
}
