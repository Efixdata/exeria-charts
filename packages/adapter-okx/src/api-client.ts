import { toOkxBar } from "./interval";
import { toOkxInstId } from "./symbol";
import {
  OkxAdapterConfig,
  OkxCandleData,
  OkxCandlesResponse,
} from "./types";

const MAX_PAGE_SIZE = 300;

export interface CandlesParams {
  symbol: string;
  interval: string;
  startTime?: number;
  endTime?: number;
  limit?: number;
}

interface CandlesPageParams {
  instId: string;
  bar: string;
  limit: number;
  after?: string;
  before?: string;
}

export class OkxApiClient {
  private baseUrl: string;
  private requestTimeout: number;
  private maxRetries: number;
  private retryDelay: number;
  private pageDelayMs: number;

  constructor(config: OkxAdapterConfig = {}) {
    this.baseUrl = config.baseUrl || "https://www.okx.com";
    this.requestTimeout = config.requestTimeout ?? 5000;
    this.maxRetries = config.maxRetries ?? 3;
    this.retryDelay = config.retryDelay ?? 1000;
    this.pageDelayMs = config.pageDelayMs ?? 120;
  }

  async getCandles(params: CandlesParams): Promise<OkxCandleData[]> {
    const instId = toOkxInstId(params.symbol);
    const bar = toOkxBar(params.interval);
    const targetLimit = params.limit ?? 100;

    const collected: OkxCandleData[] = [];
    let after: string | undefined;
    let before: string | undefined =
      params.endTime !== undefined ? params.endTime.toString() : undefined;

    while (collected.length < targetLimit) {
      const pageLimit = Math.min(targetLimit - collected.length, MAX_PAGE_SIZE);
    // @ts-ignore
      const page = await this.fetchCandlesPage({
        instId,
        bar,
        limit: pageLimit,
        after,
        before,
      });

      if (page.length === 0) {
        break;
      }

      collected.push(...page);

      if (page.length < pageLimit) {
        break;
      }

      const oldest = page[page.length - 1];
      if (!oldest) {
        break;
      }

      if (
        params.startTime !== undefined &&
        oldest.startTime <= params.startTime
      ) {
        break;
      }

      after = oldest.startTime.toString();
      before = undefined;

      if (this.pageDelayMs > 0) {
        await this.delay(this.pageDelayMs);
      }
    }

    const filtered = collected.filter((candle) => {
      if (params.startTime !== undefined && candle.startTime < params.startTime) {
        return false;
      }
      if (params.endTime !== undefined && candle.startTime > params.endTime) {
        return false;
      }
      return true;
    });

    const deduped = this.dedupeByStamp(filtered);

    // OKX returns newest-first; Exeria expects oldest-first.
    return deduped.reverse();
  }

  private async fetchCandlesPage(
    params: CandlesPageParams,
  ): Promise<OkxCandleData[]> {
    const url = this.buildUrl("/api/v5/market/candles", params);
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
            `OKX API error: ${response.status} ${response.statusText}`,
          );
        }

        const data = (await response.json()) as OkxCandlesResponse;

        if (data.code !== "0") {
          throw new Error(
            `OKX API error: ${data.msg || "Unknown error"} (${data.code})`,
          );
        }

        return this.parseCandles(data.data);
      } catch (error) {
        lastError = error as Error;

        if (
          error instanceof Error &&
          /OKX API error:.*\(\d+\)/.test(error.message)
        ) {
          throw error;
        }

        if (attempt < this.maxRetries) {
          await this.delay(this.retryDelay * Math.pow(2, attempt));
        }
      }
    }

    throw lastError || new Error("Failed to fetch candles from OKX API");
  }

  private buildUrl(endpoint: string, params: CandlesPageParams): string {
    const searchParams = new URLSearchParams();

    searchParams.append("instId", params.instId);
    searchParams.append("bar", params.bar);
    searchParams.append("limit", params.limit.toString());

    if (params.after !== undefined) {
      searchParams.append("after", params.after);
    }
    if (params.before !== undefined) {
      searchParams.append("before", params.before);
    }

    return `${this.baseUrl}${endpoint}?${searchParams.toString()}`;
  }

  private parseCandles(data: string[][]): OkxCandleData[] {
    return data.map((row) => ({
      startTime: Number(row[0] ?? 0),
      open: row[1] ?? "0",
      high: row[2] ?? "0",
      low: row[3] ?? "0",
      close: row[4] ?? "0",
      volume: row[5] ?? "0",
      volumeCcy: row[6] ?? "0",
      volumeCcyQuote: row[7] ?? "0",
      confirm: row[8] ?? "0",
    }));
  }

  private dedupeByStamp(candles: OkxCandleData[]): OkxCandleData[] {
    const seen = new Set<number>();
    const result: OkxCandleData[] = [];

    for (const candle of candles) {
      if (seen.has(candle.startTime)) {
        continue;
      }
      seen.add(candle.startTime);
      result.push(candle);
    }

    return result;
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
