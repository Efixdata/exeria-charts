export type FinageTimeUnit =
  | "minute"
  | "hour"
  | "day"
  | "week"
  | "month"
  | "quarter"
  | "year";

export type FinageInterval = {
  multiply: number;
  time: FinageTimeUnit;
};

export type FinageAdapterConfig = {
  /** Finage REST API key (required). */
  apiKey: string;
  baseUrl?: string;
  /** Full WebSocket URL from the Finage dashboard (preferred). */
  wsUrl?: string;
  /** WebSocket socket key — alternative to wsUrl. */
  socketKey?: string;
  wsSubdomain?: string;
  wsPort?: number;
  requestTimeout?: number;
  maxRetries?: number;
  retryDelay?: number;
  pollIntervalMs?: number;
  onError?: (error: unknown) => void;
};

export type FinageAggregateBar = {
  o: number;
  h: number;
  l: number;
  c: number;
  v?: number;
  t: number;
};

export type FinageAggregatesResponse = {
  symbol?: string;
  totalResults?: number;
  results?: FinageAggregateBar[];
  error?: string;
  message?: string;
};

export type FinageLastQuoteResponse = {
  symbol?: string;
  ask?: number;
  bid?: number;
  timestamp?: number;
  error?: string;
  message?: string;
};

export type FinagePriceEvent = {
  s?: string;
  p?: number | string;
  a?: number;
  b?: number;
  t?: number;
};

export interface AggregatesParams {
  symbol: string;
  interval: string;
  from?: string;
  to?: string;
  limit?: number;
}
