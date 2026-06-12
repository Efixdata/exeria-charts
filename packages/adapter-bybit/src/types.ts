/**
 * Types specific to Bybit API v5
 */

export type BybitCategory = "spot" | "linear" | "inverse";

export type BybitInterval =
  | "1"
  | "3"
  | "5"
  | "15"
  | "30"
  | "60"
  | "120"
  | "240"
  | "360"
  | "720"
  | "D"
  | "W"
  | "M";

export interface BybitKlineData {
  startTime: number;
  open: string;
  high: string;
  low: string;
  close: string;
  volume: string;
  turnover: string;
}

export interface BybitAdapterConfig {
  baseUrl?: string;
  wsUrl?: string;
  category?: BybitCategory;
  requestTimeout?: number;
  maxRetries?: number;
  retryDelay?: number;
  pingIntervalMs?: number;
}

export interface BybitKlineStreamCandle {
  start: number;
  end: number;
  interval: string;
  open: string;
  close: string;
  high: string;
  low: string;
  volume: string;
  turnover: string;
  confirm: boolean;
  timestamp: number;
}

export interface BybitKlineStreamMessage {
  topic: string;
  type: string;
  ts: number;
  data: BybitKlineStreamCandle[];
}

export interface BybitKlineResponse {
  retCode: number;
  retMsg: string;
  result: {
    symbol: string;
    category: string;
    list: string[][];
  };
}
