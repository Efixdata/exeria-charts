export type CoinbaseGranularity =
  | "ONE_MINUTE"
  | "FIVE_MINUTE"
  | "FIFTEEN_MINUTE"
  | "THIRTY_MINUTE"
  | "ONE_HOUR"
  | "TWO_HOUR"
  | "FOUR_HOUR"
  | "SIX_HOUR"
  | "ONE_DAY";

export interface CoinbaseCandleBar {
  start: string;
  low: string;
  high: string;
  open: string;
  close: string;
  volume: string;
}

export interface CoinbaseCandlesResponse {
  candles?: CoinbaseCandleBar[];
}

export interface CoinbaseMarketTrade {
  trade_id?: string;
  product_id?: string;
  price?: string;
  size?: string;
  time?: string;
  side?: string;
}

export interface CoinbaseTickerResponse {
  trades?: CoinbaseMarketTrade[];
  best_bid?: string;
  best_ask?: string;
}

export interface CoinbaseTickerBatchEvent {
  type?: string;
  tickers?: Array<{
    type?: string;
    product_id?: string;
    price?: string;
    volume_24_h?: string;
  }>;
}

export interface CoinbaseWsMessage {
  channel?: string;
  events?: CoinbaseTickerBatchEvent[];
}

export interface CoinbaseAdapterConfig {
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
