export type EodhdMarket = "stock" | "forex" | "crypto";

export type EodhdDataSource = "eod" | "intraday";

export type EodhdEodPeriod = "d" | "w" | "m";

export type EodhdIntradayInterval = "1m" | "5m" | "1h";

export type EodhdAdapterConfig = {
  /** EODHD API token (required). */
  apiKey: string;
  baseUrl?: string;
  defaultStockExchange?: string;
  requestTimeout?: number;
  maxRetries?: number;
  retryDelay?: number;
  pollIntervalMs?: number;
  onError?: (error: unknown) => void;
};

export type EodhdEodCandleRow = {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  adjusted_close?: number;
  volume: number;
};

export type EodhdIntradayCandleRow = {
  timestamp?: number;
  datetime?: string;
  gmtoffset?: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
};

export type EodhdRealTimeResponse = {
  code?: string;
  timestamp?: number;
  gmtoffset?: number;
  open?: number;
  high?: number;
  low?: number;
  close?: number;
  volume?: number;
  previousClose?: number;
  change?: number;
  change_p?: number;
  error?: string;
};

export type EodhdErrorResponse = {
  errors?: string[];
  error?: string;
};

export interface CandlesParams {
  symbol: string;
  interval: string;
  from?: Date;
  to?: Date;
  limit?: number;
}
