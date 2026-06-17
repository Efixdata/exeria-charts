import { toKucoinType } from "./interval";
import { toKucoinSymbol } from "./symbol";
import {
  KucoinAdapterConfig,
  KucoinApiResponse,
  KucoinCandleData,
  KucoinKlineRow,
  KucoinPublicTokenData,
  KucoinTickerData,
  KucoinWsConnectInfo,
} from "./types";

const MAX_PAGE_SIZE = 1500;
const SUCCESS_CODE = "200000";

export interface KlinesParams {
  symbol: string;
  interval: string;
  startTime?: number;
  endTime?: number;
  limit?: number;
}

interface KlinesPageParams {
  symbol: string;
  type: string;
  startAt?: number;
  endAt?: number;
}

export class KucoinApiClient {
  private baseUrl: string;
  private requestTimeout: number;
  private maxRetries: number;
  private retryDelay: number;
  private pageDelayMs: number;

  constructor(config: KucoinAdapterConfig = {}) {
    this.baseUrl = config.baseUrl || "https://api.kucoin.com";
    this.requestTimeout = config.requestTimeout ?? 5000;
    this.maxRetries = config.maxRetries ?? 3;
    this.retryDelay = config.retryDelay ?? 1000;
    this.pageDelayMs = config.pageDelayMs ?? 300;
  }

  async getKlines(params: KlinesParams): Promise<KucoinCandleData[]> {
    const symbol = toKucoinSymbol(params.symbol);
    const type = toKucoinType(params.interval);
    const targetLimit = params.limit ?? MAX_PAGE_SIZE;

    const collected: KucoinCandleData[] = [];
    let endAt: number | undefined =
      params.endTime !== undefined
        ? Math.floor(params.endTime / 1000)
        : undefined;
    const startAt =
      params.startTime !== undefined
        ? Math.floor(params.startTime / 1000)
        : undefined;

    while (collected.length < targetLimit) {
      const page = await this.fetchKlinesPage({
        symbol,
        type,
        ...(startAt !== undefined ? { startAt } : {}),
        ...(endAt !== undefined ? { endAt } : {}),
      });

      if (page.length === 0) {
        break;
      }

      for (const candle of page) {
        if (!collected.some((entry) => entry.startTime === candle.startTime)) {
          collected.push(candle);
        }
      }

      if (page.length < MAX_PAGE_SIZE) {
        break;
      }

      const oldest = page[page.length - 1];
      if (!oldest) {
        break;
      }

      if (startAt !== undefined && oldest.startTime <= startAt * 1000) {
        break;
      }

      const nextEndAt = Math.floor(oldest.startTime / 1000) - 1;
      if (endAt !== undefined && nextEndAt >= endAt) {
        break;
      }

      endAt = nextEndAt;

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
    const kucoinSymbol = toKucoinSymbol(symbol);
    const url = `${this.baseUrl}/api/v1/market/orderbook/level1?symbol=${encodeURIComponent(kucoinSymbol)}`;
    const data = await this.request<KucoinTickerData>(url);

    if (!data.price) {
      throw new Error(`No price data found for symbol: ${symbol}`);
    }

    return {
      price: data.price,
      stamp: data.time || Date.now(),
    };
  }

  async getPublicWsToken(): Promise<KucoinWsConnectInfo> {
    const url = `${this.baseUrl}/api/v1/bullet-public`;
    const data = await this.request<KucoinPublicTokenData>(url, {
      method: "POST",
    });

    const server = data.instanceServers[0];
    if (!server || !data.token) {
      throw new Error("KuCoin bullet-public response missing token or server");
    }

    return {
      token: data.token,
      endpoint: server.endpoint,
      pingInterval: server.pingInterval,
      pingTimeout: server.pingTimeout,
    };
  }

  private async fetchKlinesPage(params: KlinesPageParams): Promise<KucoinCandleData[]> {
    const searchParams = new URLSearchParams({
      symbol: params.symbol,
      type: params.type,
    });

    if (params.startAt !== undefined) {
      searchParams.append("startAt", params.startAt.toString());
    }
    if (params.endAt !== undefined) {
      searchParams.append("endAt", params.endAt.toString());
    }

    const url = `${this.baseUrl}/api/v1/market/candles?${searchParams.toString()}`;
    const rows = await this.request<KucoinKlineRow[]>(url);

    return this.parseKlineRows(rows);
  }

  private parseKlineRows(rows: KucoinKlineRow[]): KucoinCandleData[] {
    return rows.map((row) => ({
      startTime: Number(row[0] ?? 0) * 1000,
      open: row[1] ?? "0",
      close: row[2] ?? "0",
      high: row[3] ?? "0",
      low: row[4] ?? "0",
      volume: row[5] ?? "0",
    }));
  }

  private async request<T>(
    url: string,
    init: RequestInit = {},
  ): Promise<T> {
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
          throw new Error(
            `KuCoin API error: ${response.status} ${response.statusText}`,
          );
        }

        const payload = (await response.json()) as KucoinApiResponse<T>;

        if (payload.code !== SUCCESS_CODE) {
          throw new Error(
            `KuCoin API error: ${payload.msg || "Unknown error"} (${payload.code})`,
          );
        }

        return payload.data;
      } catch (error) {
        lastError = error as Error;

        if (
          error instanceof Error &&
          error.message.startsWith("KuCoin API error:")
        ) {
          throw error;
        }

        if (attempt < this.maxRetries) {
          await this.delay(this.retryDelay * Math.pow(2, attempt));
        }
      }
    }

    throw lastError || new Error("Failed to fetch data from KuCoin API");
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
