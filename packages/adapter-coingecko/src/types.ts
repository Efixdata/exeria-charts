/**
 * Types specific to CoinGecko API v3
 */

export type CoingeckoDays =
  | "1"
  | "7"
  | "14"
  | "30"
  | "90"
  | "180"
  | "365"
  | "max";

export type CoingeckoChartInterval = "daily" | "hourly";

export interface CoingeckoCandleData {
  stamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface CoingeckoAdapterConfig {
  baseUrl?: string;
  apiKey?: string;
  vsCurrency?: string;
  pollIntervalMs?: number;
  requestTimeout?: number;
  maxRetries?: number;
  retryDelay?: number;
}

export type CoingeckoOhlcRow = [number, number, number, number, number];

export interface CoingeckoMarketChartRangeResponse {
  prices: [number, number][];
  market_caps: [number, number][];
  total_volumes: [number, number][];
}

export interface CoingeckoSimplePriceEntry {
  last_updated_at?: number;
  [vsCurrency: string]: number | undefined;
}

export interface CoingeckoSimplePriceResponse {
  [coinId: string]: CoingeckoSimplePriceEntry;
}

export interface CoingeckoApiErrorResponse {
  error?: string | { status?: { error_code?: number; error_message?: string } };
}
