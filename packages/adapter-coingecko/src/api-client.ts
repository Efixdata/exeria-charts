import {
  chartIntervalForExeria,
  daysForInterval,
  resolveExeriaInterval,
} from "./interval";
import { normalizeCoinId } from "./symbol";
import {
  CoingeckoAdapterConfig,
  CoingeckoApiErrorResponse,
  CoingeckoCandleData,
  CoingeckoChartInterval,
  CoingeckoDays,
  CoingeckoMarketChartRangeResponse,
  CoingeckoOhlcRow,
  CoingeckoSimplePriceResponse,
} from "./types";

export interface OhlcParams {
  coinId: string;
  days: CoingeckoDays;
  vsCurrency?: string;
  interval?: CoingeckoChartInterval;
}

export interface MarketChartRangeParams {
  coinId: string;
  from: Date;
  to: Date;
  vsCurrency?: string;
  interval?: CoingeckoChartInterval;
}

export interface HistoricalParams {
  coinId: string;
  interval: string;
  from?: Date;
  to?: Date;
  limit?: number;
  vsCurrency?: string;
}

export interface SimplePriceParams {
  coinIds: string[];
  vsCurrency?: string;
}

export class CoingeckoApiClient {
  private baseUrl: string;
  private apiKey?: string;
  private vsCurrency: string;
  private requestTimeout: number;
  private maxRetries: number;
  private retryDelay: number;

  constructor(config: CoingeckoAdapterConfig = {}) {
    this.baseUrl =
      config.baseUrl || "https://api.coingecko.com/api/v3";
    if (config.apiKey) {
      this.apiKey = config.apiKey;
    }
    this.vsCurrency = config.vsCurrency || "usd";
    this.requestTimeout = config.requestTimeout ?? 5000;
    this.maxRetries = config.maxRetries ?? 3;
    this.retryDelay = config.retryDelay ?? 1000;
  }

  setApiKey(apiKey?: string): void {
    if (apiKey) {
      this.apiKey = apiKey;
    } else {
      delete this.apiKey;
    }
  }

  async getHistoricalCandles(
    params: HistoricalParams,
  ): Promise<CoingeckoCandleData[]> {
    const coinId = normalizeCoinId(params.coinId);
    const vsCurrency = params.vsCurrency || this.vsCurrency;
    const exeriaInterval = resolveExeriaInterval(params.interval);
    const chartInterval = chartIntervalForExeria(exeriaInterval);

    if (params.from && params.to) {
      const candles = await this.getMarketChartRange({
        coinId,
        from: params.from,
        to: params.to,
        vsCurrency,
        ...(chartInterval ? { interval: chartInterval } : {}),
      });
      return this.applyRangeAndLimit(candles, params);
    }

    // Demo `/ohlc` rejects `interval=` — auto granularity only. Use range for explicit intervals.
    const candles = await this.getOhlc({
      coinId,
      days: daysForInterval(exeriaInterval, params.limit),
      vsCurrency,
    });

    return this.applyRangeAndLimit(candles, params);
  }

  async getOhlc(params: OhlcParams): Promise<CoingeckoCandleData[]> {
    const coinId = normalizeCoinId(params.coinId);
    const vsCurrency = params.vsCurrency || this.vsCurrency;
    const searchParams = new URLSearchParams({
      vs_currency: vsCurrency,
      days: params.days,
    });

    if (params.interval) {
      searchParams.append("interval", params.interval);
    }

    const rows = await this.request<CoingeckoOhlcRow[]>(
      `/coins/${encodeURIComponent(coinId)}/ohlc?${searchParams.toString()}`,
    );

    return this.parseOhlcRows(rows);
  }

  async getMarketChartRange(
    params: MarketChartRangeParams,
  ): Promise<CoingeckoCandleData[]> {
    const coinId = normalizeCoinId(params.coinId);
    const vsCurrency = params.vsCurrency || this.vsCurrency;
    const searchParams = new URLSearchParams({
      vs_currency: vsCurrency,
      from: toRangeParam(params.from),
      to: toRangeParam(params.to),
    });

    if (params.interval) {
      searchParams.append("interval", params.interval);
    }

    const data = await this.request<CoingeckoMarketChartRangeResponse>(
      `/coins/${encodeURIComponent(coinId)}/market_chart/range?${searchParams.toString()}`,
    );

    return this.parseMarketChartRange(data);
  }

  async getSimplePrice(
    params: SimplePriceParams,
  ): Promise<CoingeckoSimplePriceResponse> {
    const vsCurrency = params.vsCurrency || this.vsCurrency;
    const searchParams = new URLSearchParams({
      ids: params.coinIds.map(normalizeCoinId).join(","),
      vs_currencies: vsCurrency,
      include_last_updated_at: "true",
    });

    return this.request<CoingeckoSimplePriceResponse>(
      `/simple/price?${searchParams.toString()}`,
    );
  }

  private applyRangeAndLimit(
    candles: CoingeckoCandleData[],
    params: HistoricalParams,
  ): CoingeckoCandleData[] {
    let result = candles;

    if (params.from) {
      const fromMs = params.from.getTime();
      result = result.filter((candle) => candle.stamp >= fromMs);
    }

    if (params.to) {
      const toMs = params.to.getTime();
      result = result.filter((candle) => candle.stamp <= toMs);
    }

    if (params.limit !== undefined && result.length > params.limit) {
      result = result.slice(-params.limit);
    }

    return result;
  }

  private parseOhlcRows(rows: CoingeckoOhlcRow[]): CoingeckoCandleData[] {
    const candles = rows.map((row) => ({
      stamp: row[0],
      open: row[1],
      high: row[2],
      low: row[3],
      close: row[4],
      volume: 0,
    }));

    return candles.sort((a, b) => a.stamp - b.stamp);
  }

  private parseMarketChartRange(
    data: CoingeckoMarketChartRangeResponse,
  ): CoingeckoCandleData[] {
    const volumeByStamp = new Map(
      data.total_volumes.map(([stamp, volume]) => [stamp, volume]),
    );

    const candles = data.prices.map(([stamp, price]) => ({
      stamp,
      open: price,
      high: price,
      low: price,
      close: price,
      volume: volumeByStamp.get(stamp) ?? 0,
    }));

    return candles.sort((a, b) => a.stamp - b.stamp);
  }

  private async request<T>(path: string): Promise<T> {
    const url = `${this.baseUrl}${path}`;
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(
          () => controller.abort(),
          this.requestTimeout,
        );

        const headers: Record<string, string> = {
          Accept: "application/json",
        };

        if (this.apiKey) {
          headers["x-cg-pro-api-key"] = this.apiKey;
        }

        const response = await fetch(url, {
          signal: controller.signal,
          headers,
        });

        clearTimeout(timeoutId);

        if (response.status === 429 && attempt < this.maxRetries) {
          await this.delay(this.retryDelay * Math.pow(2, attempt));
          continue;
        }

        if (!response.ok) {
          throw new Error(
            `CoinGecko API error: ${response.status} ${response.statusText}`,
          );
        }

        const data = (await response.json()) as T & CoingeckoApiErrorResponse;

        if (data && typeof data === "object" && "error" in data && data.error) {
          const message =
            typeof data.error === "string"
              ? data.error
              : data.error.status?.error_message || "Unknown CoinGecko error";
          throw new Error(`CoinGecko API error: ${message}`);
        }

        return data;
      } catch (error) {
        lastError = error as Error;

        if (
          error instanceof Error &&
          error.message.startsWith("CoinGecko API error:")
        ) {
          throw error;
        }

        if (attempt < this.maxRetries) {
          await this.delay(this.retryDelay * Math.pow(2, attempt));
        }
      }
    }

    throw lastError || new Error("Failed to fetch data from CoinGecko API");
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

function toRangeParam(date: Date): string {
  return date.toISOString().slice(0, 10);
}
