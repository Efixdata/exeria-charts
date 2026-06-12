/**
 * Types specific to Kraken Spot API
 */

export type KrakenIntervalMinutes =
  | 1
  | 5
  | 15
  | 30
  | 60
  | 240
  | 1440
  | 10080
  | 21600;

export interface KrakenCandleData {
  startTime: number;
  open: string;
  high: string;
  low: string;
  close: string;
  volume: string;
}

export interface KrakenAdapterConfig {
  baseUrl?: string;
  wsUrl?: string;
  requestTimeout?: number;
  maxRetries?: number;
  retryDelay?: number;
  pageDelayMs?: number;
  heartbeatDeadlineMs?: number;
}

export type KrakenOhlcRow = [
  number,
  string,
  string,
  string,
  string,
  string,
  string,
  number,
];

export interface KrakenOhlcResult {
  [pairKey: string]: KrakenOhlcRow[] | number | undefined;
  last?: number;
}

export interface KrakenOhlcResponse {
  error: string[];
  result: KrakenOhlcResult;
}

export interface KrakenTickerEntry {
  c: [string, string];
  v: [string, string];
}

export interface KrakenTickerResponse {
  error: string[];
  result: Record<string, KrakenTickerEntry>;
}

export interface KrakenOhlcStreamCandle {
  symbol: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  interval_begin: string;
  interval: number;
}

export interface KrakenOhlcStreamMessage {
  channel: "ohlc";
  type: "snapshot" | "update";
  data: KrakenOhlcStreamCandle[];
}

export interface KrakenHeartbeatMessage {
  channel: "heartbeat";
}

export interface KrakenSubscriptionParams {
  channel: "ohlc";
  symbol: string;
  interval: KrakenIntervalMinutes;
}
