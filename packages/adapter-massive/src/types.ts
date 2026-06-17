export type MassiveMarket = "stocks" | "crypto" | "forex";

export type MassiveTimespan =
  | "minute"
  | "hour"
  | "day"
  | "week"
  | "month"
  | "quarter"
  | "year";

export interface MassiveRange {
  multiplier: number;
  timespan: MassiveTimespan;
}

export interface MassiveCandleBar {
  o: number;
  h: number;
  l: number;
  c: number;
  v?: number;
  t: number;
}

export interface MassiveAggregatesResponse {
  ticker?: string;
  status: string;
  results?: MassiveCandleBar[];
  resultsCount?: number;
  next_url?: string;
  error?: string;
  message?: string;
}

export interface MassivePrevResponse {
  status: string;
  results?: MassiveCandleBar[];
  error?: string;
  message?: string;
}

export interface MassiveAdapterConfig {
  apiKey: string;
  baseUrl?: string;
  wsUrls?: Partial<Record<MassiveMarket, string>>;
  requestTimeout?: number;
  maxRetries?: number;
  retryDelay?: number;
  pageDelayMs?: number;
  pollIntervalMs?: number;
  onError?: (error: unknown) => void;
}

export interface MassiveAggregateMessage {
  ev: "AM" | "XA" | "CA";
  sym?: string;
  pair?: string;
  o?: number;
  h?: number;
  l?: number;
  c?: number;
  v?: number;
  s?: number;
  e?: number;
}

export interface MassiveStatusMessage {
  ev: "status";
  status: string;
  message?: string;
}
