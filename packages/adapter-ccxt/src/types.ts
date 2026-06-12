export const VERIFIED_CCXT_EXCHANGE_IDS = [
  "binance",
  "bybit",
  "okx",
  "kraken",
  "coinbase",
  "kucoin",
  "gate",
  "bitfinex",
  "mexc",
] as const;

export type VerifiedCcxtExchangeId = (typeof VERIFIED_CCXT_EXCHANGE_IDS)[number];

export type CcxtAdapterConfig = {
  /** CCXT exchange id, e.g. "binance", "kraken", "okx". */
  exchangeId: string;
  apiKey?: string;
  secret?: string;
  password?: string;
  sandbox?: boolean;
  /** @default true */
  enableRateLimit?: boolean;
  /** Polling interval for subscribeToUpdates in milliseconds. @default 2000 */
  pollIntervalMs?: number;
  proxyUrl?: string;
  onError?: (error: unknown) => void;
};
