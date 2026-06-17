export const FOREX_QUOTES = [
  "USDT",
  "USDC",
  "USD",
  "EUR",
  "GBP",
  "JPY",
  "CHF",
  "AUD",
  "CAD",
  "NZD",
  "CNY",
  "HKD",
  "SGD",
  "TRY",
  "ZAR",
  "MXN",
] as const;

const FOREX_EXCHANGES = new Set(["OANDA", "FXCM", "FOREXCOM", "PEPPERSTONE"]);

const CRYPTO_QUOTES = ["USDT", "USDC", "USD", "BTC", "ETH"] as const;

export type FinnhubSymbolOptions = {
  defaultForexExchange?: string;
  defaultCryptoExchange?: string;
};

export function isCompactForexPair(compact: string): boolean {
  if (!/^[A-Z]{6}$/.test(compact)) {
    return false;
  }

  for (const quote of FOREX_QUOTES) {
    if (compact.endsWith(quote) && compact.length > quote.length) {
      return true;
    }
  }

  return false;
}

function splitCompactForex(compact: string): string {
  for (const quote of FOREX_QUOTES) {
    if (compact.endsWith(quote) && compact.length > quote.length) {
      const base = compact.slice(0, -quote.length);
      return `${base}_${quote}`;
    }
  }

  return compact;
}

function looksLikeCryptoCompact(compact: string): boolean {
  if (compact.length < 6) {
    return false;
  }

  for (const quote of CRYPTO_QUOTES) {
    if (compact.endsWith(quote) && compact.length > quote.length) {
      return true;
    }
  }

  return false;
}

function normalizeExchangePair(exchange: string, pair: string): string {
  const upperExchange = exchange.toUpperCase();
  const upperPair = pair.toUpperCase();

  if (upperPair.includes("/") || upperPair.includes("-")) {
    if (FOREX_EXCHANGES.has(upperExchange)) {
      return `${upperExchange}:${upperPair.replace(/[/-]/g, "_")}`;
    }

    return `${upperExchange}:${upperPair.replace(/\//g, "").replace(/-/g, "")}`;
  }

  if (FOREX_EXCHANGES.has(upperExchange) && /^[A-Z]{6}$/.test(upperPair)) {
    return `${upperExchange}:${splitCompactForex(upperPair)}`;
  }

  return `${upperExchange}:${upperPair}`;
}

export function toFinnhubSymbol(
  symbol: string,
  options: FinnhubSymbolOptions = {},
): string {
  const trimmed = symbol.trim();
  const defaultForex = (options.defaultForexExchange ?? "OANDA").toUpperCase();
  const defaultCrypto = (options.defaultCryptoExchange ?? "BINANCE").toUpperCase();

  if (trimmed.includes(":")) {
    const separator = trimmed.indexOf(":");
    const exchange = trimmed.slice(0, separator);
    const pair = trimmed.slice(separator + 1);
    return normalizeExchangePair(exchange, pair);
  }

  if (/^[A-Za-z]{3}[/-][A-Za-z]{3}$/.test(trimmed)) {
    const pair = trimmed.replace(/[/-]/g, "_").toUpperCase();
    return `${defaultForex}:${pair}`;
  }

  const compact = trimmed.replace(/[/-]/g, "").toUpperCase();

  if (isCompactForexPair(compact)) {
    return `${defaultForex}:${splitCompactForex(compact)}`;
  }

  if (looksLikeCryptoCompact(compact)) {
    return `${defaultCrypto}:${compact}`;
  }

  return compact;
}

export function splitCompactForexSymbol(symbol: string): string {
  const upper = symbol.trim().toUpperCase();

  for (const quote of FOREX_QUOTES) {
    if (upper.endsWith(quote) && upper.length > quote.length) {
      const base = upper.slice(0, -quote.length);
      return `${base}/${quote}`;
    }
  }

  return upper;
}

export function toDisplayForexSymbol(symbol: string): string {
  if (symbol.includes(":")) {
    const pair = symbol.split(":")[1] ?? symbol;
    if (pair.includes("_")) {
      return pair.replace(/_/g, "/");
    }
    return pair;
  }

  const compact = symbol.replace(/[/-]/g, "").toUpperCase();
  if (/^[A-Z]{6}$/.test(compact)) {
    return splitCompactForexSymbol(compact);
  }

  return symbol;
}
