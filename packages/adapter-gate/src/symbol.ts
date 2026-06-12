const SPOT_QUOTE_SUFFIXES = ["USDT", "USDC", "USD", "BTC", "ETH"] as const;

export function toGateCurrencyPair(symbol: string): string {
  const upper = symbol.trim().toUpperCase();

  if (upper.includes("_")) {
    return upper;
  }

  if (upper.includes("-")) {
    return upper.replace(/-/g, "_");
  }

  if (upper.includes("/")) {
    return upper.replace(/\//g, "_");
  }

  for (const quote of SPOT_QUOTE_SUFFIXES) {
    if (upper.endsWith(quote) && upper.length > quote.length) {
      const base = upper.slice(0, -quote.length);
      return `${base}_${quote}`;
    }
  }

  return `${upper}_USDT`;
}
