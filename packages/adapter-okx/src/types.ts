/**
 * Types specific to OKX API v5
 */

export type OkxBar =
  | "1m"
  | "3m"
  | "5m"
  | "15m"
  | "30m"
  | "1H"
  | "2H"
  | "4H"
  | "6H"
  | "12H"
  | "1D"
  | "1W"
  | "1M";

export interface OkxCandleData {
  startTime: number;
  open: string;
  high: string;
  low: string;
  close: string;
  volume: string;
  volumeCcy: string;
  volumeCcyQuote: string;
  confirm: string;
}

export interface OkxAdapterConfig {
  baseUrl?: string;
  wsUrl?: string;
  requestTimeout?: number;
  maxRetries?: number;
  retryDelay?: number;
  pageDelayMs?: number;
}

export interface OkxCandlesResponse {
  code: string;
  msg: string;
  data: string[][];
}

export interface OkxCandleStreamMessage {
  arg: {
    channel: string;
    instId: string;
  };
  data: string[][];
}

export interface OkxSubscriptionArg {
  channel: string;
  instId: string;
}
