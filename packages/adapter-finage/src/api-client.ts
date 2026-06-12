import { mapAggregateBarsToCandles } from "./candles";
import { resolveAggregatesDateRange } from "./date-range";
import { assertFinageOk } from "./errors";
import { toFinageInterval } from "./interval";
import { resolveFinageMarket } from "./market";
import { toFinageSymbol } from "./symbol";
import { mapLastQuoteToTick } from "./ticker";
import type {
  AggregatesParams,
  FinageAdapterConfig,
  FinageAggregatesResponse,
  FinageLastQuoteResponse,
} from "./types";
import type { Candle, Tick } from "@efixdata/exeria-chart";

const MAX_LIMIT = 5000;

export class FinageApiClient {
  private apiKey: string;
  private baseUrl: string;
  private requestTimeout: number;
  private maxRetries: number;
  private retryDelay: number;

  constructor(config: FinageAdapterConfig) {
    if (!config.apiKey) {
      throw new Error("FinageApiClient requires apiKey");
    }

    this.apiKey = config.apiKey;
    this.baseUrl = config.baseUrl ?? "https://api.finage.co.uk";
    this.requestTimeout = config.requestTimeout ?? 10000;
    this.maxRetries = config.maxRetries ?? 3;
    this.retryDelay = config.retryDelay ?? 1000;
  }

  async getAggregates(params: AggregatesParams): Promise<Candle[]> {
    const symbol = toFinageSymbol(params.symbol);
    const market = resolveFinageMarket(params.symbol);
    const { multiply, time } = toFinageInterval(params.interval);
    const { from, to } = resolveAggregatesDateRange({
      interval: params.interval,
      ...(params.from ? { from: new Date(params.from) } : {}),
      ...(params.to ? { to: new Date(params.to) } : {}),
      ...(params.limit !== undefined ? { limit: params.limit } : {}),
    });
    const limit = Math.min(params.limit ?? 500, MAX_LIMIT);

    const searchParams = new URLSearchParams({
      apikey: this.apiKey,
      limit: String(limit),
      sort: "asc",
    });

    const url = `${this.baseUrl}/agg/${market}/${symbol}/${multiply}/${time}/${from}/${to}?${searchParams.toString()}`;
    const payload = await this.fetchJson<FinageAggregatesResponse>(url);
    assertFinageOk(payload);

    return mapAggregateBarsToCandles(payload.results ?? []);
  }

  async getLatestPrice(symbol: string): Promise<Tick> {
    const normalizedSymbol = toFinageSymbol(symbol);
    const market = resolveFinageMarket(symbol);
    const searchParams = new URLSearchParams({
      apikey: this.apiKey,
    });

    const url = `${this.baseUrl}/last/${market}/${normalizedSymbol}?${searchParams.toString()}`;
    const payload = await this.fetchJson<FinageLastQuoteResponse>(url);
    assertFinageOk(payload);

    return mapLastQuoteToTick(payload);
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
          message?: string;
        };

        if (!response.ok) {
          throw new Error(
            payload.message ??
              payload.error ??
              `Finage API error: ${response.status} ${response.statusText}`,
          );
        }

        return payload;
      } catch (error) {
        lastError = error as Error;

        if (
          error instanceof Error &&
          /Finage API error: 4\d\d/.test(error.message)
        ) {
          throw error;
        }

        if (attempt < this.maxRetries) {
          await this.delay(this.retryDelay * Math.pow(2, attempt));
        }
      }
    }

    throw lastError ?? new Error("Failed to fetch data from Finage API");
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
