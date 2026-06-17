import { mapEodCandles, mapIntradayCandles } from "./candles";
import {
  resolveEodDateRange,
  resolveIntradayUnixRange,
  splitIntradayWindows,
} from "./date-range";
import { assertEodhdOk } from "./errors";
import {
  assertSupportedInterval,
  resolveDataSource,
  toEodhdIntradayInterval,
  toEodhdPeriod,
} from "./interval";
import { toEodhdSymbol } from "./symbol";
import { mapLastCandleToTick, mapRealTimeToTick } from "./ticker";
import type {
  CandlesParams,
  EodhdAdapterConfig,
  EodhdEodCandleRow,
  EodhdIntradayCandleRow,
  EodhdRealTimeResponse,
} from "./types";
import type { Candle, Tick } from "@efixdata/exeria-chart";

const MAX_LIMIT = 5000;

export class EodhdApiClient {
  private apiKey: string;
  private baseUrl: string;
  private requestTimeout: number;
  private maxRetries: number;
  private retryDelay: number;
  private symbolOptions: {
    defaultStockExchange?: string;
  };

  constructor(config: EodhdAdapterConfig) {
    if (!config.apiKey) {
      throw new Error("EodhdApiClient requires apiKey");
    }

    this.apiKey = config.apiKey;
    this.baseUrl = config.baseUrl ?? "https://eodhd.com/api";
    this.requestTimeout = config.requestTimeout ?? 10000;
    this.maxRetries = config.maxRetries ?? 3;
    this.retryDelay = config.retryDelay ?? 1000;
    this.symbolOptions = {
      ...(config.defaultStockExchange
        ? { defaultStockExchange: config.defaultStockExchange }
        : {}),
    };
  }

  async getCandles(params: CandlesParams): Promise<Candle[]> {
    assertSupportedInterval(params.interval);

    const source = resolveDataSource(params.interval);
    const symbol = toEodhdSymbol(params.symbol, this.symbolOptions);

    if (source === "eod") {
      return this.getEodCandles(symbol, params);
    }

    return this.getIntradayCandles(symbol, params);
  }

  async getLatestPrice(symbol: string): Promise<Tick> {
    const normalizedSymbol = toEodhdSymbol(symbol, this.symbolOptions);
    const searchParams = new URLSearchParams({
      api_token: this.apiKey,
      fmt: "json",
    });

    const url = `${this.baseUrl}/real-time/${encodeURIComponent(normalizedSymbol)}?${searchParams.toString()}`;
    const payload = await this.fetchJson<EodhdRealTimeResponse>(url);
    assertEodhdOk(payload);

    if (payload.close === undefined) {
      const candles = await this.getCandles({
        symbol,
        interval: "1d",
        limit: 1,
      });
      const last = candles[candles.length - 1];

      if (!last) {
        throw new Error(`No recent price data for ${symbol}`);
      }

      return mapLastCandleToTick(last);
    }

    return mapRealTimeToTick(payload);
  }

  private async getEodCandles(
    symbol: string,
    params: CandlesParams,
  ): Promise<Candle[]> {
    const period = toEodhdPeriod(params.interval);
    const { from, to } = resolveEodDateRange({
      interval: params.interval,
      ...(params.from ? { from: params.from } : {}),
      ...(params.to ? { to: params.to } : {}),
      ...(params.limit !== undefined ? { limit: params.limit } : {}),
    });

    const searchParams = new URLSearchParams({
      api_token: this.apiKey,
      fmt: "json",
      period,
      from,
      to,
      order: "a",
    });

    const url = `${this.baseUrl}/eod/${encodeURIComponent(symbol)}?${searchParams.toString()}`;
    const payload = await this.fetchJson<EodhdEodCandleRow[]>(url);
    assertEodhdOk(payload);

    if (!Array.isArray(payload)) {
      throw new Error("Unexpected EODHD EOD response");
    }

    const candles = mapEodCandles(payload);
    return this.applyLimit(candles, params.limit);
  }

  private async getIntradayCandles(
    symbol: string,
    params: CandlesParams,
  ): Promise<Candle[]> {
    const interval = toEodhdIntradayInterval(params.interval);
    const { from, to } = resolveIntradayUnixRange({
      interval: params.interval,
      ...(params.from ? { from: params.from } : {}),
      ...(params.to ? { to: params.to } : {}),
      ...(params.limit !== undefined ? { limit: params.limit } : {}),
    });

    const windows = splitIntradayWindows({
      from,
      to,
      interval: params.interval,
    });

    const candles: Candle[] = [];

    for (const window of windows) {
      const searchParams = new URLSearchParams({
        api_token: this.apiKey,
        fmt: "json",
        interval,
        from: String(window.from),
        to: String(window.to),
      });

      const url = `${this.baseUrl}/intraday/${encodeURIComponent(symbol)}?${searchParams.toString()}`;
      const payload = await this.fetchJson<EodhdIntradayCandleRow[]>(url);
      assertEodhdOk(payload);

      if (!Array.isArray(payload)) {
        throw new Error("Unexpected EODHD intraday response");
      }

      candles.push(...mapIntradayCandles(payload));

      const limit = params.limit ?? MAX_LIMIT;
      if (candles.length >= limit) {
        break;
      }
    }

    const deduped = dedupeCandles(candles);
    return this.applyLimit(deduped, params.limit);
  }

  private applyLimit(candles: Candle[], limit?: number): Candle[] {
    const effectiveLimit = Math.min(limit ?? candles.length, MAX_LIMIT);

    if (effectiveLimit > 0 && candles.length > effectiveLimit) {
      return candles.slice(-effectiveLimit);
    }

    return candles;
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

        const response = await fetch(url, {
          signal: controller.signal,
          headers: {
            Accept: "application/json",
          },
        });

        clearTimeout(timeoutId);

        const rawBody = await response.text();
        const payload = parseEodhdJson<T>(rawBody);

        if (!response.ok) {
          assertEodhdOk(payload);
          throw new Error(
            typeof payload === "string"
              ? payload
              : `EODHD API error: ${response.status} ${response.statusText}`,
          );
        }

        assertEodhdOk(payload);
        return payload;
      } catch (error) {
        lastError = error as Error;

        if (
          error instanceof Error &&
          /EODHD API error: 4\d\d/.test(error.message)
        ) {
          throw error;
        }

        if (attempt < this.maxRetries) {
          await this.delay(this.retryDelay * Math.pow(2, attempt));
        }
      }
    }

    throw lastError ?? new Error("Failed to fetch data from EODHD API");
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

function parseEodhdJson<T>(rawBody: string): T {
  const trimmed = rawBody.trim();

  if (!trimmed) {
    return [] as T;
  }

  try {
    return JSON.parse(trimmed) as T;
  } catch {
    throw new Error(trimmed);
  }
}

function dedupeCandles(candles: Candle[]): Candle[] {
  const byStamp = new Map<number, Candle>();

  for (const candle of candles) {
    byStamp.set(candle.stamp, candle);
  }

  return [...byStamp.values()].sort((a, b) => a.stamp - b.stamp);
}
