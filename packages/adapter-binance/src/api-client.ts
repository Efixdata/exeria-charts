import { BinanceKlineData, BinanceInterval, BinanceAdapterConfig } from "./types";

export interface KlinesParams {
  symbol: string;
  interval: BinanceInterval;
  startTime?: number;
  endTime?: number;
  limit?: number;
}

export class BinanceApiClient {
  private baseUrl: string;
  private requestTimeout: number;
  private maxRetries: number;
  private retryDelay: number;

  constructor(config: BinanceAdapterConfig = {}) {
    this.baseUrl = config.baseUrl || "https://api.binance.com";
    this.requestTimeout = config.requestTimeout || 5000;
    this.maxRetries = config.maxRetries || 3;
    this.retryDelay = config.retryDelay || 1000;
  }

  async getKlines(params: KlinesParams): Promise<BinanceKlineData[]> {
    const url = this.buildUrl("/api/v3/klines", params);
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.requestTimeout);

        const response = await fetch(url, {
          signal: controller.signal,
          headers: {
            "Accept": "application/json",
          },
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(
            `Binance API error: ${response.status} ${response.statusText}`
          );
        }

        const data = await response.json();
        return this.parseKlines(data);
      } catch (error) {
        lastError = error as Error;

        // Don't retry on client errors (4xx)
        if (error instanceof Error && error.message.includes("4")) {
          throw error;
        }

        // Wait before retrying
        if (attempt < this.maxRetries) {
          await this.delay(this.retryDelay * Math.pow(2, attempt));
        }
      }
    }

    throw lastError || new Error("Failed to fetch klines from Binance API");
  }

  private buildUrl(endpoint: string, params: KlinesParams): string {
    const searchParams = new URLSearchParams();
    searchParams.append("symbol", params.symbol.toUpperCase());
    searchParams.append("interval", params.interval);

    if (params.startTime !== undefined) {
      searchParams.append("startTime", params.startTime.toString());
    }
    if (params.endTime !== undefined) {
      searchParams.append("endTime", params.endTime.toString());
    }
    if (params.limit !== undefined) {
      searchParams.append("limit", Math.min(params.limit, 1000).toString());
    }

    return `${this.baseUrl}${endpoint}?${searchParams.toString()}`;
  }

  private parseKlines(data: any[][]): BinanceKlineData[] {
    return data.map((kline) => ({
      openTime: kline[0],
      open: kline[1],
      high: kline[2],
      low: kline[3],
      close: kline[4],
      volume: kline[5],
      closeTime: kline[6],
      quoteAssetVolume: kline[7],
      numberOfTrades: kline[8],
      takerBuyBaseAssetVolume: kline[9],
      takerBuyQuoteAssetVolume: kline[10],
    }));
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
