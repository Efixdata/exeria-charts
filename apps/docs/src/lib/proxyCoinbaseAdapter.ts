import type { Candle, DataAdapter, LoadDataOptions, Tick } from "@efixdata/exeria-chart";

export type ProxyCoinbaseAdapterConfig = {
  apiBase?: string;
  pollIntervalMs?: number;
  onError?: (error: unknown) => void;
};

function isHtmlResponse(text: string): boolean {
  const trimmed = text.trim().toLowerCase();
  return trimmed.startsWith("<!doctype html") || trimmed.startsWith("<html");
}

async function readResponseText(response: Response): Promise<string> {
  return response.text();
}

async function readApiError(response: Response): Promise<string> {
  const text = await readResponseText(response);

  if (isHtmlResponse(text)) {
    return "Coinbase API proxy is unavailable. Restart docs with `npm run dev` (not `docusaurus serve`) so /api/coinbase routes are registered.";
  }

  try {
    const payload = JSON.parse(text) as { error?: string };
    if (payload.error) {
      return payload.error;
    }
  } catch {
    // fall through
  }

  return `Request failed (${response.status})`;
}

async function readJsonPayload<T>(response: Response): Promise<T> {
  const text = await readResponseText(response);

  if (isHtmlResponse(text)) {
    throw new Error(
      "Coinbase API proxy returned HTML instead of JSON. Restart docs with `npm run dev` so /api/coinbase routes are registered.",
    );
  }

  return JSON.parse(text) as T;
}

export class ProxyCoinbaseAdapter implements DataAdapter {
  private apiBase: string;
  private pollIntervalMs: number;
  private onError?: (error: unknown) => void;
  private pollStops: Map<string, () => void> = new Map();
  private priceUpdateCallbacks: Map<string, Set<(update: Tick) => void>> = new Map();
  private lastPrice: Map<string, Tick> = new Map();

  constructor(config: ProxyCoinbaseAdapterConfig = {}) {
    this.apiBase = config.apiBase ?? "/api/coinbase";
    this.pollIntervalMs = config.pollIntervalMs ?? 5000;
    if (config.onError) {
      this.onError = config.onError;
    }
  }

  async initialize(_config: Record<string, unknown>): Promise<void> {
    // Proxy adapter is stateless on the client.
  }

  async getHistoricalData(
    symbol: string,
    options: LoadDataOptions,
  ): Promise<Candle[]> {
    const params = new URLSearchParams({
      symbol,
      interval: options.interval,
    });

    if (options.limit !== undefined) {
      params.set("limit", String(options.limit));
    }

    const response = await fetch(`${this.apiBase}/ohlcv?${params.toString()}`);
    if (!response.ok) {
      throw new Error(await readApiError(response));
    }

    const payload = await readJsonPayload<{ candles: Candle[] }>(response);
    return payload.candles;
  }

  async getCurrentPrice(symbol: string): Promise<Tick> {
    const cached = this.lastPrice.get(symbol);
    if (cached) {
      return cached;
    }

    const params = new URLSearchParams({ symbol });
    const response = await fetch(`${this.apiBase}/ticker?${params.toString()}`);
    if (!response.ok) {
      throw new Error(await readApiError(response));
    }

    const payload = await readJsonPayload<{ tick: Tick }>(response);
    this.lastPrice.set(symbol, payload.tick);
    return payload.tick;
  }

  subscribeToUpdates(
    symbol: string,
    callback: (update: Tick) => void,
  ): () => void {
    const key = symbol;

    if (!this.priceUpdateCallbacks.has(key)) {
      this.priceUpdateCallbacks.set(key, new Set());

      let active = true;
      const poll = async () => {
        if (!active) {
          return;
        }

        try {
          const tick = await this.getCurrentPrice(symbol);
          this.lastPrice.set(symbol, tick);

          const callbacks = this.priceUpdateCallbacks.get(key);
          if (callbacks) {
            callbacks.forEach((cb) => cb(tick));
          }
        } catch (error) {
          this.onError?.(error);
        }
      };

      void poll();
      const timer = window.setInterval(() => {
        void poll();
      }, this.pollIntervalMs);

      this.pollStops.set(key, () => {
        active = false;
        window.clearInterval(timer);
      });
    }

    this.priceUpdateCallbacks.get(key)!.add(callback);

    return () => {
      const callbacks = this.priceUpdateCallbacks.get(key);
      if (!callbacks) {
        return;
      }

      callbacks.delete(callback);

      if (callbacks.size === 0) {
        const stop = this.pollStops.get(key);
        if (stop) {
          stop();
          this.pollStops.delete(key);
        }
        this.priceUpdateCallbacks.delete(key);
      }
    };
  }

  async disconnect(): Promise<void> {
    this.pollStops.forEach((stop) => stop());
    this.pollStops.clear();
    this.priceUpdateCallbacks.clear();
    this.lastPrice.clear();
  }
}
