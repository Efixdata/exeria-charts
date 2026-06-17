import { mapMassiveBarsToCandles } from "./candles";
import { estimateRangeMs, toMassiveRange } from "./interval";
import { toMassiveTicker } from "./symbol";
import { mapBarToTick } from "./ticker";
import type {
  MassiveAdapterConfig,
  MassiveAggregatesResponse,
  MassiveCandleBar,
  MassivePrevResponse,
} from "./types";
import type { Candle, Tick } from "@efixdata/exeria-chart";

const DEFAULT_BASE_URL = "https://api.massive.com";
const MAX_PAGE_LIMIT = 5000;

export class MassiveApiClient {
  private apiKey: string;
  private baseUrl: string;
  private requestTimeout: number;
  private maxRetries: number;
  private retryDelay: number;
  private pageDelayMs: number;

  constructor(config: MassiveAdapterConfig) {
    if (!config.apiKey) {
      throw new Error("MassiveApiClient requires apiKey");
    }

    this.apiKey = config.apiKey;
    this.baseUrl = config.baseUrl ?? DEFAULT_BASE_URL;
    this.requestTimeout = config.requestTimeout ?? 10000;
    this.maxRetries = config.maxRetries ?? 3;
    this.retryDelay = config.retryDelay ?? 1000;
    this.pageDelayMs = config.pageDelayMs ?? 0;
  }

  async getAggregates(params: {
    symbol: string;
    interval: string;
    limit?: number;
    from?: Date;
    to?: Date;
  }): Promise<Candle[]> {
    const ticker = toMassiveTicker(params.symbol);
    const { multiplier, timespan } = toMassiveRange(params.interval);
    const limit = Math.min(params.limit ?? 500, MAX_PAGE_LIMIT);
    const endTime = params.to?.getTime() ?? Date.now();
    const startTime =
      params.from?.getTime() ?? endTime - estimateRangeMs(params.interval, limit);

    const searchParams = new URLSearchParams({
      apiKey: this.apiKey,
      sort: "asc",
      limit: String(limit),
    });

    const path = `/v2/aggs/ticker/${encodeURIComponent(ticker)}/range/${multiplier}/${timespan}/${startTime}/${endTime}`;
    let url = `${this.baseUrl}${path}?${searchParams.toString()}`;

    const bars: MassiveCandleBar[] = [];

    while (url) {
      const payload = await this.fetchJson<MassiveAggregatesResponse>(url);
      assertMassiveOk(payload);

      if (payload.results?.length) {
        bars.push(...payload.results);
      }

      if (!payload.next_url || bars.length >= limit) {
        break;
      }

      url = this.resolveNextUrl(payload.next_url);
      if (this.pageDelayMs > 0) {
        await sleep(this.pageDelayMs);
      }
    }

    return mapMassiveBarsToCandles(bars.slice(0, limit));
  }

  async getPreviousClose(symbol: string): Promise<Tick> {
    const ticker = toMassiveTicker(symbol);
    const searchParams = new URLSearchParams({
      apiKey: this.apiKey,
    });

    const url = `${this.baseUrl}/v2/aggs/ticker/${encodeURIComponent(ticker)}/prev?${searchParams.toString()}`;
    const payload = await this.fetchJson<MassivePrevResponse>(url);
    assertMassiveOk(payload);

    const bar = payload.results?.[0];
    if (!bar) {
      throw new Error(`No previous close for ${symbol}`);
    }

    return mapBarToTick(bar);
  }

  private resolveNextUrl(nextUrl: string): string {
    const parsed = new URL(nextUrl, this.baseUrl);
    if (!parsed.searchParams.has("apiKey")) {
      parsed.searchParams.set("apiKey", this.apiKey);
    }

    return parsed.toString();
  }

  private async fetchJson<T>(url: string): Promise<T> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(
          () => controller.abort(),
          this.requestTimeout,
        );

        const response = await fetch(url, { signal: controller.signal });
        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(`Massive API HTTP ${response.status}: ${response.statusText}`);
        }

        return (await response.json()) as T;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        if (attempt < this.maxRetries) {
          await sleep(this.retryDelay * (attempt + 1));
        }
      }
    }

    throw lastError ?? new Error("Massive API request failed");
  }
}

const MASSIVE_SUCCESS_STATUSES = new Set(["OK", "DELAYED"]);

function assertMassiveOk(
  payload: MassiveAggregatesResponse | MassivePrevResponse,
): void {
  if (MASSIVE_SUCCESS_STATUSES.has(payload.status)) {
    return;
  }

  const detail = payload.error ?? payload.message ?? payload.status;
  throw new Error(`Massive API error: ${detail}`);
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
