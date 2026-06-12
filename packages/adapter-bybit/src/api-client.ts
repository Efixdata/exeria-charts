import { toBybitInterval } from "./interval";
import {
  BybitAdapterConfig,
  BybitCategory,
  BybitKlineData,
  BybitKlineResponse,
} from "./types";

export interface KlinesParams {
  symbol: string;
  interval: string;
  category?: BybitCategory;
  startTime?: number;
  endTime?: number;
  limit?: number;
}

export class BybitApiClient {
  private baseUrl: string;
  private category: BybitCategory;
  private requestTimeout: number;
  private maxRetries: number;
  private retryDelay: number;

  constructor(config: BybitAdapterConfig = {}) {
    this.baseUrl = config.baseUrl || "https://api.bybit.com";
    this.category = config.category || "spot";
    this.requestTimeout = config.requestTimeout ?? 5000;
    this.maxRetries = config.maxRetries ?? 3;
    this.retryDelay = config.retryDelay ?? 1000;
  }

  async getKlines(params: KlinesParams): Promise<BybitKlineData[]> {
    const url = this.buildUrl("/v5/market/kline", params);
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

        if (!response.ok) {
          throw new Error(
            `Bybit API error: ${response.status} ${response.statusText}`,
          );
        }

        const data = (await response.json()) as BybitKlineResponse;

        if (data.retCode !== 0) {
          throw new Error(`Bybit API error: ${data.retMsg} (${data.retCode})`);
        }

        return this.parseKlines(data.result.list);
      } catch (error) {
        lastError = error as Error;

        if (
          error instanceof Error &&
          /Bybit API error:.*\([1-9]\d{3,}\)/.test(error.message)
        ) {
          throw error;
        }

        if (attempt < this.maxRetries) {
          await this.delay(this.retryDelay * Math.pow(2, attempt));
        }
      }
    }

    throw lastError || new Error("Failed to fetch klines from Bybit API");
  }

  private buildUrl(endpoint: string, params: KlinesParams): string {
    const searchParams = new URLSearchParams();
    const bybitInterval = toBybitInterval(params.interval);

    searchParams.append("category", params.category || this.category);
    searchParams.append("symbol", params.symbol.toUpperCase());
    searchParams.append("interval", bybitInterval);

    if (params.startTime !== undefined) {
      searchParams.append("start", params.startTime.toString());
    }
    if (params.endTime !== undefined) {
      searchParams.append("end", params.endTime.toString());
    }
    if (params.limit !== undefined) {
      searchParams.append("limit", Math.min(params.limit, 1000).toString());
    }

    return `${this.baseUrl}${endpoint}?${searchParams.toString()}`;
  }

  private parseKlines(data: string[][]): BybitKlineData[] {
    const klines = data.map((kline) => ({
      startTime: Number(kline[0] ?? 0),
      open: kline[1] ?? "0",
      high: kline[2] ?? "0",
      low: kline[3] ?? "0",
      close: kline[4] ?? "0",
      volume: kline[5] ?? "0",
      turnover: kline[6] ?? "0",
    }));

    // Bybit returns newest-first; Exeria expects oldest-first.
    return klines.reverse();
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
