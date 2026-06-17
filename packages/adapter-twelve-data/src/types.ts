export type TwelveDataInterval =
  | "1min"
  | "5min"
  | "15min"
  | "30min"
  | "45min"
  | "1h"
  | "2h"
  | "4h"
  | "8h"
  | "1day"
  | "1week"
  | "1month";

export type TwelveDataAdapterConfig = {
  /** Twelve Data API key (required). */
  apiKey: string;
  baseUrl?: string;
  wsUrl?: string;
  requestTimeout?: number;
  maxRetries?: number;
  retryDelay?: number;
  onError?: (error: unknown) => void;
};

export type TwelveDataTimeSeriesValue = {
  datetime: string;
  open: string;
  high: string;
  low: string;
  close: string;
  volume?: string;
};

export type TwelveDataTimeSeriesResponse = {
  meta?: {
    symbol?: string;
    interval?: string;
    exchange_timezone?: string;
  };
  values?: TwelveDataTimeSeriesValue[];
  status?: string;
  code?: number;
  message?: string;
};

export type TwelveDataPriceResponse = {
  price?: string;
  code?: number;
  message?: string;
  status?: string;
};

export type TwelveDataPriceEvent = {
  event?: string;
  symbol?: string;
  price?: number | string;
  timestamp?: number;
  currency?: string;
  exchange?: string;
  type?: string;
};

export interface TimeSeriesParams {
  symbol: string;
  interval: string;
  outputsize?: number;
  startDate?: string;
  endDate?: string;
}
