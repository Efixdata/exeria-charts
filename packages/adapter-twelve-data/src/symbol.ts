const FOREX_QUOTES = [
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

export function toTwelveDataSymbol(symbol: string): string {
  const trimmed = symbol.trim();

  if (trimmed.includes("/")) {
    return trimmed.toUpperCase();
  }

  if (trimmed.includes("-")) {
    const [base, quote] = trimmed.toUpperCase().split("-");
    if (base && quote) {
      return `${base}/${quote}`;
    }
  }

  if (/^[A-Z]{6}$/i.test(trimmed)) {
    return splitCompactForexSymbol(trimmed);
  }

  return trimmed.toUpperCase();
}
