export type GateInterval =
  | "10s"
  | "1m"
  | "5m"
  | "15m"
  | "30m"
  | "1h"
  | "4h"
  | "8h"
  | "1d"
  | "7d";

export type GateCandleRow = string[];

export interface GateTicker {
  currency_pair: string;
  last: string;
  lowest_ask?: string;
  highest_bid?: string;
  change_percentage?: string;
  base_volume?: string;
  quote_volume?: string;
  high_24h?: string;
  low_24h?: string;
}

export interface GateCandlestickUpdate {
  t: string;
  v?: string;
  c: string;
  h: string;
  l: string;
  o: string;
  a?: string;
  w?: boolean;
  n?: string;
}

export interface GateWsMessage {
  time?: number;
  channel?: string;
  event?: string;
  result?: GateCandlestickUpdate;
  error?: { code?: number; message?: string };
}

export interface GateAdapterConfig {
  baseUrl?: string;
  wsUrl?: string;
  requestTimeout?: number;
  maxRetries?: number;
  retryDelay?: number;
  pageDelayMs?: number;
  pollingIntervalMs?: number;
  useWebSocket?: boolean;
  onError?: (error: unknown) => void;
}
