import { mapFinnhubCandlesResponse } from "./candles";
import { resolveCandleDateRange } from "./date-range";
import { assertFinnhubOk } from "./errors";
import { toFinnhubResolution } from "./interval";
import { resolveFinnhubMarket } from "./market";
import { toFinnhubSymbol } from "./symbol";
import { mapLastCandleToTick, mapQuoteToTick } from "./ticker";
import type {
  CandlesParams,
  FinnhubAdapterConfig,
  FinnhubCandlesResponse,
  FinnhubQuoteResponse,
} from "./types";
import type { Candle, Tick } from "@efixdata/exeria-chart";

const MAX_LIMIT = 5000;

export class FinnhubApiClient {
  private apiKey: string;
  private baseUrl: string;
  private requestTimeout: number;
  private maxRetries: number;
  private retryDelay: number;
  private symbolOptions: {
    defaultForexExchange?: string;
    defaultCryptoExchange?: string;
  };

  constructor(config: FinnhubAdapterConfig) {
    if (!config.apiKey) {
      throw new Error("FinnhubApiClient requires apiKey");
    }

    this.apiKey = config.apiKey;
    this.baseUrl = config.baseUrl ?? "https://finnhub.io/api/v1";
    this.requestTimeout = config.requestTimeout ?? 10000;
    this.maxRetries = config.maxRetries ?? 3;
    this.retryDelay = config.retryDelay ?? 1000;
    this.symbolOptions = {
      ...(config.defaultForexExchange
        ? { defaultForexExchange: config.defaultForexExchange }
        : {}),
      ...(config.defaultCryptoExchange
        ? { defaultCryptoExchange: config.defaultCryptoExchange }
        : {}),
    };
  }

  async getCandles(params: CandlesParams): Promise<Candle[]> {
    const market = resolveFinnhubMarket(params.symbol);
    const symbol = toFinnhubSymbol(params.symbol, this.symbolOptions);
    const resolution = toFinnhubResolution(params.interval);
    const { from, to } = resolveCandleDateRange({
      interval: params.interval,
      ...(params.from ? { from: params.from } : {}),
      ...(params.to ? { to: params.to } : {}),
      ...(params.limit !== undefined ? { limit: params.limit } : {}),
    });

    const searchParams = new URLSearchParams({
      symbol,
      resolution,
      from: String(from),
      to: String(to),
      token: this.apiKey,
    });

    const endpoint =
      market === "stock"
        ? "stock/candle"
        : market === "forex"
          ? "forex/candle"
          : "crypto/candle";

    const url = `${this.baseUrl}/${endpoint}?${searchParams.toString()}`;
    const payload = await this.fetchJson<FinnhubCandlesResponse>(url);
    assertFinnhubOk(payload);

    const candles = mapFinnhubCandlesResponse(payload);
    const limit = Math.min(params.limit ?? candles.length, MAX_LIMIT);

    if (limit > 0 && candles.length > limit) {
      return candles.slice(-limit);
    }

    return candles;
  }

  async getLatestPrice(symbol: string): Promise<Tick> {
    const market = resolveFinnhubMarket(symbol);

    if (market === "stock") {
      const normalizedSymbol = toFinnhubSymbol(symbol, this.symbolOptions);
      const searchParams = new URLSearchParams({
        symbol: normalizedSymbol,
        token: this.apiKey,
      });

      const url = `${this.baseUrl}/quote?${searchParams.toString()}`;
      const payload = await this.fetchJson<FinnhubQuoteResponse>(url);
      assertFinnhubOk(payload);

      return mapQuoteToTick(payload);
    }

    const candles = await this.getCandles({
      symbol,
      interval: "1m",
      limit: 1,
    });

    const last = candles[candles.length - 1];
    if (!last) {
      throw new Error(`No recent price data for ${symbol}`);
    }

    return mapLastCandleToTick(last);
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

        const payload = (await response.json()) as T & {
          error?: string;
        };

        if (!response.ok) {
          throw new Error(
            payload.error ??
              `Finnhub API error: ${response.status} ${response.statusText}`,
          );
        }

        return payload;
      } catch (error) {
        lastError = error as Error;

        if (
          error instanceof Error &&
          /Finnhub API error: 4\d\d/.test(error.message)
        ) {
          throw error;
        }

        if (attempt < this.maxRetries) {
          await this.delay(this.retryDelay * Math.pow(2, attempt));
        }
      }
    }

    throw lastError ?? new Error("Failed to fetch data from Finnhub API");
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
