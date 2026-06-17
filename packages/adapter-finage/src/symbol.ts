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

export function toFinageSymbol(symbol: string): string {
  const trimmed = symbol.trim();

  if (trimmed.includes("/")) {
    return trimmed.replace(/\//g, "").toUpperCase();
  }

  if (trimmed.includes("-")) {
    return trimmed.replace(/-/g, "").toUpperCase();
  }

  return trimmed.toUpperCase();
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
  const compact = toFinageSymbol(symbol);

  if (/^[A-Z]{6}$/.test(compact)) {
    return splitCompactForexSymbol(compact);
  }

  return compact;
}
