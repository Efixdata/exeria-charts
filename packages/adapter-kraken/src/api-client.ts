import { toKrakenInterval } from "./interval";
import { toKrakenRestPair } from "./symbol";
import {
  KrakenAdapterConfig,
  KrakenCandleData,
  KrakenOhlcResponse,
  KrakenOhlcRow,
  KrakenTickerResponse,
} from "./types";

const MAX_PAGE_SIZE = 720;

export interface OhlcParams {
  symbol: string;
  interval: string;
  startTime?: number;
  endTime?: number;
  limit?: number;
}

interface OhlcPage {
  candles: KrakenCandleData[];
  last?: number;
}

export class KrakenApiClient {
  private baseUrl: string;
  private requestTimeout: number;
  private maxRetries: number;
  private retryDelay: number;
  private pageDelayMs: number;

  constructor(config: KrakenAdapterConfig = {}) {
    this.baseUrl = config.baseUrl || "https://api.kraken.com";
    this.requestTimeout = config.requestTimeout ?? 5000;
    this.maxRetries = config.maxRetries ?? 3;
    this.retryDelay = config.retryDelay ?? 1000;
    this.pageDelayMs = config.pageDelayMs ?? 1000;
  }

  async getOhlc(params: OhlcParams): Promise<KrakenCandleData[]> {
    const restPair = toKrakenRestPair(params.symbol);
    const interval = toKrakenInterval(params.interval);
    const targetLimit = params.limit ?? MAX_PAGE_SIZE;

    const collected: KrakenCandleData[] = [];
    let since: number | undefined =
      params.startTime !== undefined
        ? Math.floor(params.startTime / 1000)
        : undefined;

    while (collected.length < targetLimit) {
      const page = await this.fetchOhlcPage({
        pair: restPair,
        interval,
        since,
      });

      if (page.candles.length === 0) {
        break;
      }

      for (const candle of page.candles) {
        if (!collected.some((entry) => entry.startTime === candle.startTime)) {
          collected.push(candle);
        }
      }

      if (page.candles.length < MAX_PAGE_SIZE) {
        break;
      }

      if (page.last === undefined || page.last === since) {
        break;
      }

      since = page.last;

      if (this.pageDelayMs > 0) {
        await this.delay(this.pageDelayMs);
      }
    }

    const sorted = collected.sort((a, b) => a.startTime - b.startTime);
    const filtered = sorted.filter((candle) => {
      if (params.startTime !== undefined && candle.startTime < params.startTime) {
        return false;
      }
      if (params.endTime !== undefined && candle.startTime > params.endTime) {
        return false;
      }
      return true;
    });

    if (filtered.length > targetLimit) {
      return filtered.slice(-targetLimit);
    }

    return filtered;
  }

  async getTickerPrice(symbol: string): Promise<{ price: string; stamp: number }> {
    const restPair = toKrakenRestPair(symbol);
    const url = `${this.baseUrl}/0/public/Ticker?pair=${encodeURIComponent(restPair)}`;
    const data = await this.request<KrakenTickerResponse>(url);

    const pairKey = Object.keys(data.result)[0];
    if (!pairKey) {
      throw new Error(`No ticker data found for symbol: ${symbol}`);
    }

    const ticker = data.result[pairKey];
    const price = ticker?.c?.[0];

    if (!price) {
      throw new Error(`No price data found for symbol: ${symbol}`);
    }

    return {
      price,
      stamp: Date.now(),
    };
  }

  private async fetchOhlcPage(params: {
    pair: string;
    interval: number;
    since?: number;
  }): Promise<OhlcPage> {
    const searchParams = new URLSearchParams({
      pair: params.pair,
      interval: params.interval.toString(),
    });

    if (params.since !== undefined) {
      searchParams.append("since", params.since.toString());
    }

    const url = `${this.baseUrl}/0/public/OHLC?${searchParams.toString()}`;
    const data = await this.request<KrakenOhlcResponse>(url);

    const pairKey = Object.keys(data.result).find((key) => key !== "last");
    if (!pairKey) {
      return { candles: [] };
    }

    const rows = data.result[pairKey];
    if (!Array.isArray(rows)) {
      return { candles: [] };
    }

    const lastValue = data.result.last;

    return {
      candles: this.parseOhlcRows(rows),
      ...(typeof lastValue === "number" ? { last: lastValue } : {}),
    };
  }

  private parseOhlcRows(rows: KrakenOhlcRow[]): KrakenCandleData[] {
    return rows.map((row) => ({
      startTime: Number(row[0] ?? 0) * 1000,
      open: row[1] ?? "0",
      high: row[2] ?? "0",
      low: row[3] ?? "0",
      close: row[4] ?? "0",
      volume: row[6] ?? "0",
    }));
  }

  private async request<T extends { error: string[] }>(url: string): Promise<T> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(
          () => controller.abort(),
          this.requestTimeout,
        );

        const response = await fetch(url, {
          signal: controller.signal,
          headers: {
            Accept: "application/json",
          },
        });

        clearTimeout(timeoutId);

        if (response.status === 429 && attempt < this.maxRetries) {
          await this.delay(this.retryDelay * Math.pow(2, attempt));
          continue;
        }

        if (!response.ok) {
          throw new Error(
            `Kraken API error: ${response.status} ${response.statusText}`,
          );
        }

        const data = (await response.json()) as T;

        if (data.error.length > 0) {
          throw new Error(`Kraken API error: ${data.error.join(", ")}`);
        }

        return data;
      } catch (error) {
        lastError = error as Error;

        if (
          error instanceof Error &&
          error.message.startsWith("Kraken API error:")
        ) {
          throw error;
        }

        if (attempt < this.maxRetries) {
          await this.delay(this.retryDelay * Math.pow(2, attempt));
        }
      }
    }

    throw lastError || new Error("Failed to fetch data from Kraken API");
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
