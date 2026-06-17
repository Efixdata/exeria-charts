export type FinnhubMarket = "stock" | "forex" | "crypto";

export type FinnhubAdapterConfig = {
  /** Finnhub REST API token (required). */
  apiKey: string;
  baseUrl?: string;
  wsUrl?: string;
  defaultForexExchange?: string;
  defaultCryptoExchange?: string;
  requestTimeout?: number;
  maxRetries?: number;
  retryDelay?: number;
  pollIntervalMs?: number;
  onError?: (error: unknown) => void;
};

export type FinnhubCandlesResponse = {
  s: "ok" | "no_data" | string;
  c?: number[];
  h?: number[];
  l?: number[];
  o?: number[];
  t?: number[];
  v?: number[];
  error?: string;
};

export type FinnhubQuoteResponse = {
  c?: number;
  h?: number;
  l?: number;
  o?: number;
  pc?: number;
  t?: number;
  error?: string;
};

export type FinnhubTradeEvent = {
  s?: string;
  p?: number;
  t?: number;
  v?: number;
};

export type FinnhubWsMessage =
  | { type: "ping" }
  | { type: "trade"; data?: FinnhubTradeEvent[] }
  | { type: string; data?: unknown };

export interface CandlesParams {
  symbol: string;
  interval: string;
  from?: Date;
  to?: Date;
  limit?: number;
}
