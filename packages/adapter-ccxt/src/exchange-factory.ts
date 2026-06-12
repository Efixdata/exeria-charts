import ccxt, { Exchange } from "ccxt";
import type { CcxtAdapterConfig } from "./types";

export function isCcxtExchangeId(exchangeId: string): boolean {
  const normalized = exchangeId.trim().toLowerCase();
  const candidate = (ccxt as Record<string, unknown>)[normalized];
  return typeof candidate === "function";
}

export function createCcxtExchange(config: CcxtAdapterConfig): Exchange {
  const exchangeId = config.exchangeId.trim().toLowerCase();

  if (!isCcxtExchangeId(exchangeId)) {
    throw new Error(`Unsupported CCXT exchange: ${config.exchangeId}`);
  }

  const ExchangeClass = (ccxt as unknown as Record<string, new (options?: object) => Exchange>)[
    exchangeId
  ];

  return new ExchangeClass({
    apiKey: config.apiKey,
    secret: config.secret,
    password: config.password,
    enableRateLimit: config.enableRateLimit ?? true,
    sandbox: config.sandbox,
    ...(config.proxyUrl ? { proxy: config.proxyUrl } : {}),
  });
}
