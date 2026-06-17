import { mapCoinbaseBarsToCandles } from "./candles";
import {
  COINBASE_MAX_CANDLES_PER_REQUEST,
  capCoinbasePageLimit,
  estimateRangeSeconds,
  granularitySeconds,
  toCoinbaseGranularity,
} from "./interval";
import { toCoinbaseProductId } from "./symbol";
import { mapTickerResponseToTick } from "./ticker";
import type {
  CoinbaseAdapterConfig,
  CoinbaseCandleBar,
  CoinbaseCandlesResponse,
  CoinbaseTickerResponse,
} from "./types";
import type { Candle, Tick } from "@efixdata/exeria-chart";

const DEFAULT_BASE_URL = "https://api.coinbase.com";
const MAX_PAGE_SIZE = COINBASE_MAX_CANDLES_PER_REQUEST;

export interface CandlesParams {
  symbol: string;
  interval: string;
  startTime?: number;
  endTime?: number;
  limit?: number;
}

export class CoinbaseApiClient {
  private baseUrl: string;
  private requestTimeout: number;
  private maxRetries: number;
  private retryDelay: number;
  private pageDelayMs: number;

  constructor(config: CoinbaseAdapterConfig = {}) {
    this.baseUrl = config.baseUrl ?? DEFAULT_BASE_URL;
    this.requestTimeout = config.requestTimeout ?? 10000;
    this.maxRetries = config.maxRetries ?? 3;
    this.retryDelay = config.retryDelay ?? 1000;
    this.pageDelayMs = config.pageDelayMs ?? 300;
  }

  async getCandles(params: CandlesParams): Promise<Candle[]> {
    const productId = toCoinbaseProductId(params.symbol);
    const granularity = toCoinbaseGranularity(params.interval);
    const targetLimit = params.limit ?? MAX_PAGE_SIZE;

    const collected: CoinbaseCandleBar[] = [];
    const stepSec = granularitySeconds(params.interval);
    const explicitStartSec =
      params.startTime !== undefined
        ? Math.floor(params.startTime / 1000)
        : undefined;
    let endSec =
      params.endTime !== undefined
        ? Math.floor(params.endTime / 1000)
        : Math.floor(Date.now() / 1000);

    while (collected.length < targetLimit) {
      const remaining = targetLimit - collected.length;
      const pageLimit = capCoinbasePageLimit(
        Math.min(MAX_PAGE_SIZE, remaining),
      );
      let windowStartSec =
        endSec - estimateRangeSeconds(params.interval, pageLimit);
      if (explicitStartSec !== undefined) {
        windowStartSec = Math.max(explicitStartSec, windowStartSec);
      }

      if (windowStartSec >= endSec) {
        break;
      }

      const page = await this.fetchCandlesPage({
        productId,
        granularity,
        startSec: windowStartSec,
        endSec,
        limit: pageLimit,
      });

      if (page.length === 0) {
        break;
      }

      for (const candle of page) {
        if (!collected.some((entry) => entry.start === candle.start)) {
          collected.push(candle);
        }
      }

      if (page.length < pageLimit) {
        break;
      }

      const oldest = [...page].sort(
        (a, b) => Number(a.start) - Number(b.start),
      )[0];
      if (!oldest) {
        break;
      }

      const oldestSec = Number(oldest.start);
      if (
        explicitStartSec !== undefined &&
        oldestSec <= explicitStartSec
      ) {
        break;
      }

      endSec = oldestSec - stepSec;

      if (this.pageDelayMs > 0) {
        await this.delay(this.pageDelayMs);
      }
    }

    const candles = mapCoinbaseBarsToCandles(collected);
    const filtered = candles.filter((candle) => {
      if (params.startTime !== undefined && candle.stamp < params.startTime) {
        return false;
      }
      if (params.endTime !== undefined && candle.stamp > params.endTime) {
        return false;
      }
      return true;
    });

    if (filtered.length > targetLimit) {
      return filtered.slice(-targetLimit);
    }

    return filtered;
  }

  async getLatestPrice(symbol: string): Promise<Tick> {
    const productId = toCoinbaseProductId(symbol);
    const url = `${this.baseUrl}/api/v3/brokerage/market/products/${encodeURIComponent(productId)}/ticker?limit=1`;
    const payload = await this.request<CoinbaseTickerResponse>(url);

    return mapTickerResponseToTick(payload);
  }

  private async fetchCandlesPage(params: {
    productId: string;
    granularity: string;
    startSec: number;
    endSec: number;
    limit: number;
  }): Promise<CoinbaseCandleBar[]> {
    const searchParams = new URLSearchParams({
      start: String(params.startSec),
      end: String(params.endSec),
      granularity: params.granularity,
      limit: String(params.limit),
    });

    const url = `${this.baseUrl}/api/v3/brokerage/market/products/${encodeURIComponent(params.productId)}/candles?${searchParams.toString()}`;
    const payload = await this.request<CoinbaseCandlesResponse>(url);

    return payload.candles ?? [];
  }

  private async request<T>(url: string, init: RequestInit = {}): Promise<T> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(
          () => controller.abort(),
          this.requestTimeout,
        );

        const response = await fetch(url, {
          ...init,
          signal: controller.signal,
          headers: {
            Accept: "application/json",
            ...(init.headers ?? {}),
          },
        });

        clearTimeout(timeoutId);

        if (response.status === 429 && attempt < this.maxRetries) {
          await this.delay(this.retryDelay * Math.pow(2, attempt));
          continue;
        }

        if (!response.ok) {
          let details = "";
          try {
            const errorPayload = (await response.json()) as {
              message?: string;
              error_details?: string;
            };
            details =
              errorPayload.message ??
              errorPayload.error_details ??
              "";
          } catch {
            // ignore non-JSON error bodies
          }

          throw new Error(
            details
              ? `Coinbase API error: ${response.status} ${response.statusText} — ${details}`
              : `Coinbase API error: ${response.status} ${response.statusText}`,
          );
        }

        return (await response.json()) as T;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        if (
          error instanceof Error &&
          error.message.startsWith("Coinbase API error:")
        ) {
          throw error;
        }

        if (attempt < this.maxRetries) {
          await this.delay(this.retryDelay * Math.pow(2, attempt));
        }
      }
    }

    throw lastError ?? new Error("Failed to fetch data from Coinbase API");
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
