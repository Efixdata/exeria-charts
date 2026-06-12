/**
 * Types specific to KuCoin Spot API
 */

export type KucoinCandleType =
  | "1min"
  | "3min"
  | "5min"
  | "15min"
  | "30min"
  | "1hour"
  | "2hour"
  | "4hour"
  | "6hour"
  | "8hour"
  | "12hour"
  | "1day"
  | "1week";

export interface KucoinCandleData {
  startTime: number;
  open: string;
  high: string;
  low: string;
  close: string;
  volume: string;
}

export interface KucoinAdapterConfig {
  baseUrl?: string;
  requestTimeout?: number;
  maxRetries?: number;
  retryDelay?: number;
  pageDelayMs?: number;
  pollingIntervalMs?: number;
}

export type KucoinKlineRow = [
  string,
  string,
  string,
  string,
  string,
  string,
  string,
];

export interface KucoinApiResponse<T> {
  code: string;
  data: T;
  msg?: string;
}

export interface KucoinTickerData {
  time: number;
  sequence: string;
  price: string;
  size: string;
  bestBid: string;
  bestBidSize: string;
  bestAsk: string;
  bestAskSize: string;
}

export interface KucoinInstanceServer {
  endpoint: string;
  encrypt: boolean;
  protocol: string;
  pingInterval: number;
  pingTimeout: number;
}

export interface KucoinPublicTokenData {
  token: string;
  instanceServers: KucoinInstanceServer[];
}

export interface KucoinWsConnectInfo {
  token: string;
  endpoint: string;
  pingInterval: number;
  pingTimeout: number;
}

export interface KucoinCandleStreamMessage {
  topic: string;
  type: string;
  subject?: string;
  data?: {
    symbol: string;
    candles: string[];
    time?: number;
  };
}
