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

export type EodhdSymbolOptions = {
  defaultStockExchange?: string;
};

const CRYPTO_BASES = new Set([
  "BTC",
  "ETH",
  "SOL",
  "BNB",
  "XRP",
  "ADA",
  "DOGE",
  "DOT",
  "MATIC",
  "LTC",
  "AVAX",
  "LINK",
  "UNI",
  "ATOM",
  "XLM",
  "BCH",
  "FIL",
  "TRX",
  "ETC",
  "NEAR",
  "APT",
  "ARB",
  "OP",
  "SHIB",
  "SUI",
  "PEPE",
  "TON",
]);

export function looksLikeCryptoPair(trimmed: string): boolean {
  if (trimmed.toUpperCase().endsWith(".CC")) {
    return true;
  }

  if (/^[A-Z0-9]+-[A-Z0-9]+$/i.test(trimmed) && !trimmed.includes(".")) {
    const [base] = trimmed.split("-");
    return Boolean(base && CRYPTO_BASES.has(base.toUpperCase()));
  }

  if (trimmed.includes("/")) {
    const [base] = trimmed.split("/");
    return Boolean(base && CRYPTO_BASES.has(base.toUpperCase()));
  }

  const compact = trimmed.replace(/[/-]/g, "").toUpperCase();

  for (const quote of ["USDT", "USDC", "USD", "BTC", "ETH"] as const) {
    if (compact.endsWith(quote) && compact.length > quote.length) {
      const base = compact.slice(0, -quote.length);
      if (CRYPTO_BASES.has(base)) {
        return true;
      }
    }
  }

  return false;
}

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

function toForexSymbol(trimmed: string): string {
  if (trimmed.toUpperCase().endsWith(".FOREX")) {
    return trimmed.toUpperCase();
  }

  const compact = trimmed.replace(/[/-]/g, "").toUpperCase();
  return `${compact}.FOREX`;
}

function toCryptoSymbol(trimmed: string): string {
  if (trimmed.toUpperCase().endsWith(".CC")) {
    return trimmed.toUpperCase();
  }

  if (trimmed.includes("/")) {
    const [base, quote] = trimmed.split("/");
    if (base && quote) {
      return `${base.toUpperCase()}-${quote.toUpperCase()}.CC`;
    }
  }

  if (trimmed.includes("-") && !trimmed.includes(".")) {
    return `${trimmed.toUpperCase()}.CC`;
  }

  const compact = trimmed.replace(/[/-]/g, "").toUpperCase();

  for (const quote of ["USDT", "USDC", "USD", "BTC", "ETH"] as const) {
    if (compact.endsWith(quote) && compact.length > quote.length) {
      const base = compact.slice(0, -quote.length);
      return `${base}-${quote}.CC`;
    }
  }

  return `${trimmed.toUpperCase()}.CC`;
}

export function toEodhdSymbol(
  symbol: string,
  options: EodhdSymbolOptions = {},
): string {
  const trimmed = symbol.trim();
  const upper = trimmed.toUpperCase();
  const defaultExchange = (options.defaultStockExchange ?? "US").toUpperCase();

  if (upper.includes(".") && !upper.endsWith(".FOREX") && !upper.endsWith(".CC")) {
    return upper;
  }

  if (upper.endsWith(".FOREX") || upper.endsWith(".CC")) {
    return upper;
  }

  if (looksLikeCryptoPair(trimmed)) {
    return toCryptoSymbol(trimmed);
  }

  if (/^[A-Za-z]{3}[/-][A-Za-z]{3}$/.test(trimmed)) {
    return toForexSymbol(trimmed);
  }

  const compact = trimmed.replace(/[/-]/g, "").toUpperCase();

  if (isCompactForexPair(compact)) {
    return `${compact}.FOREX`;
  }

  if (/^[A-Z]{1,5}$/.test(compact)) {
    return `${compact}.${defaultExchange}`;
  }

  return `${upper}.${defaultExchange}`;
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
  if (symbol.toUpperCase().endsWith(".FOREX")) {
    const pair = symbol.slice(0, -".FOREX".length);
    if (/^[A-Z]{6}$/i.test(pair)) {
      return splitCompactForexSymbol(pair);
    }
    return pair;
  }

  const compact = symbol.replace(/[/-]/g, "").toUpperCase();
  if (/^[A-Z]{6}$/.test(compact)) {
    return splitCompactForexSymbol(compact);
  }

  return symbol;
}
