import { mapTimeSeriesValuesToCandles } from "./candles";
import { assertTwelveDataOk } from "./errors";
import { toTwelveDataInterval } from "./interval";
import { toTwelveDataSymbol } from "./symbol";
import { mapPriceResponseToTick } from "./ticker";
import type {
  TwelveDataAdapterConfig,
  TwelveDataPriceResponse,
  TwelveDataTimeSeriesResponse,
  TimeSeriesParams,
} from "./types";
import type { Candle, Tick } from "@efixdata/exeria-chart";

const MAX_OUTPUT_SIZE = 5000;

export class TwelveDataApiClient {
  private apiKey: string;
  private baseUrl: string;
  private requestTimeout: number;
  private maxRetries: number;
  private retryDelay: number;

  constructor(config: TwelveDataAdapterConfig) {
    if (!config.apiKey) {
      throw new Error("TwelveDataApiClient requires apiKey");
    }

    this.apiKey = config.apiKey;
    this.baseUrl = config.baseUrl ?? "https://api.twelvedata.com";
    this.requestTimeout = config.requestTimeout ?? 10000;
    this.maxRetries = config.maxRetries ?? 3;
    this.retryDelay = config.retryDelay ?? 1000;
  }

  async getTimeSeries(params: TimeSeriesParams): Promise<Candle[]> {
    const symbol = toTwelveDataSymbol(params.symbol);
    const interval = toTwelveDataInterval(params.interval);
    const searchParams = new URLSearchParams({
      symbol,
      interval,
      apikey: this.apiKey,
      format: "JSON",
      order: "ASC",
    });

    if (params.outputsize !== undefined) {
      searchParams.set(
        "outputsize",
        Math.min(params.outputsize, MAX_OUTPUT_SIZE).toString(),
      );
    }

    if (params.startDate) {
      searchParams.set("start_date", params.startDate);
    }

    if (params.endDate) {
      searchParams.set("end_date", params.endDate);
    }

    const url = `${this.baseUrl}/time_series?${searchParams.toString()}`;
    const payload = await this.fetchJson<TwelveDataTimeSeriesResponse>(url);
    assertTwelveDataOk(payload);

    return mapTimeSeriesValuesToCandles(payload.values ?? []);
  }

  async getLatestPrice(symbol: string): Promise<Tick> {
    const normalizedSymbol = toTwelveDataSymbol(symbol);
    const searchParams = new URLSearchParams({
      symbol: normalizedSymbol,
      apikey: this.apiKey,
      format: "JSON",
    });

    const url = `${this.baseUrl}/price?${searchParams.toString()}`;
    const payload = await this.fetchJson<TwelveDataPriceResponse>(url);
    assertTwelveDataOk(payload);

    return mapPriceResponseToTick(payload);
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
          status?: string;
          message?: string;
          code?: number;
        };

        if (!response.ok) {
          throw new Error(
            payload.message ??
              `Twelve Data API error: ${response.status} ${response.statusText}`,
          );
        }

        return payload;
      } catch (error) {
        lastError = error as Error;

        if (
          error instanceof Error &&
          /Twelve Data API error: 4\d\d/.test(error.message)
        ) {
          throw error;
        }

        if (attempt < this.maxRetries) {
          await this.delay(this.retryDelay * Math.pow(2, attempt));
        }
      }
    }

    throw lastError ?? new Error("Failed to fetch data from Twelve Data API");
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
