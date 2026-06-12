import { mapGateCandleRows } from "./candles";
import {
  estimateRangeSeconds,
  toGateInterval,
} from "./interval";
import { toGateCurrencyPair } from "./symbol";
import { mapGateTickerToTick } from "./ticker";
import type { GateAdapterConfig, GateCandleRow, GateTicker } from "./types";
import type { Candle, Tick } from "@efixdata/exeria-chart";

const DEFAULT_BASE_URL = "https://api.gateio.ws/api/v4";
const MAX_PAGE_SIZE = 1000;

export interface CandlesParams {
  symbol: string;
  interval: string;
  startTime?: number;
  endTime?: number;
  limit?: number;
}

export class GateApiClient {
  private baseUrl: string;
  private requestTimeout: number;
  private maxRetries: number;
  private retryDelay: number;
  private pageDelayMs: number;

  constructor(config: GateAdapterConfig = {}) {
    this.baseUrl = config.baseUrl ?? DEFAULT_BASE_URL;
    this.requestTimeout = config.requestTimeout ?? 10000;
    this.maxRetries = config.maxRetries ?? 3;
    this.retryDelay = config.retryDelay ?? 1000;
    this.pageDelayMs = config.pageDelayMs ?? 300;
  }

  async getCandles(params: CandlesParams): Promise<Candle[]> {
    const currencyPair = toGateCurrencyPair(params.symbol);
    const interval = toGateInterval(params.interval);
    const targetLimit = params.limit ?? MAX_PAGE_SIZE;

    const collected: GateCandleRow[] = [];
    let toSec =
      params.endTime !== undefined
        ? Math.floor(params.endTime / 1000)
        : Math.floor(Date.now() / 1000);
    const fromSec =
      params.startTime !== undefined
        ? Math.floor(params.startTime / 1000)
        : toSec - estimateRangeSeconds(params.interval, targetLimit);

    while (collected.length < targetLimit) {
      const pageLimit = Math.min(MAX_PAGE_SIZE, targetLimit - collected.length);
      const page = await this.fetchCandlesPage({
        currencyPair,
        interval,
        fromSec,
        toSec,
        limit: pageLimit,
      });

      if (page.length === 0) {
        break;
      }

      for (const candle of page) {
        const stampSec = Number(candle[0] ?? 0);
        if (!collected.some((entry) => Number(entry[0]) === stampSec)) {
          collected.push(candle);
        }
      }

      if (page.length < MAX_PAGE_SIZE) {
        break;
      }

      const oldest = [...page].sort(
        (a, b) => Number(a[0] ?? 0) - Number(b[0] ?? 0),
      )[0];
      if (!oldest) {
        break;
      }

      const oldestSec = Number(oldest[0] ?? 0);
      if (oldestSec <= fromSec) {
        break;
      }

      toSec = oldestSec - 1;

      if (this.pageDelayMs > 0) {
        await this.delay(this.pageDelayMs);
      }
    }

    const candles = mapGateCandleRows(collected);
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
    const currencyPair = toGateCurrencyPair(symbol);
    const searchParams = new URLSearchParams({
      currency_pair: currencyPair,
    });
    const url = `${this.baseUrl}/spot/tickers?${searchParams.toString()}`;
    const payload = await this.request<GateTicker[]>(url);
    const ticker = payload[0];

    if (!ticker) {
      throw new Error(`Gate.io ticker not found for ${currencyPair}`);
    }

    return mapGateTickerToTick(ticker);
  }

  private async fetchCandlesPage(params: {
    currencyPair: string;
    interval: string;
    fromSec: number;
    toSec: number;
    limit: number;
  }): Promise<GateCandleRow[]> {
    const searchParams = new URLSearchParams({
      currency_pair: params.currencyPair,
      interval: params.interval,
      from: String(params.fromSec),
      to: String(params.toSec),
      limit: String(params.limit),
    });

    const url = `${this.baseUrl}/spot/candlesticks?${searchParams.toString()}`;
    const payload = await this.request<GateCandleRow[]>(url);

    return Array.isArray(payload) ? payload : [];
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
          let message = `Gate.io API error: ${response.status} ${response.statusText}`;
          try {
            const errorBody = (await response.json()) as {
              label?: string;
              message?: string;
            };
            if (errorBody.message) {
              message = `Gate.io API error: ${errorBody.message}`;
            }
          } catch {
            // ignore parse errors
          }
          throw new Error(message);
        }

        return (await response.json()) as T;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        if (
          error instanceof Error &&
          error.message.startsWith("Gate.io API error:")
        ) {
          throw error;
        }

        if (attempt < this.maxRetries) {
          await this.delay(this.retryDelay * Math.pow(2, attempt));
        }
      }
    }

    throw lastError ?? new Error("Failed to fetch data from Gate.io API");
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
