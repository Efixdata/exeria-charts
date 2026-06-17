const SPOT_QUOTE_SUFFIXES = ["USDT", "USDC", "USD", "BTC", "ETH"] as const;

export function toOkxInstId(symbol: string): string {
  const upper = symbol.trim().toUpperCase();

  if (upper.includes("-")) {
    return upper;
  }

  for (const quote of SPOT_QUOTE_SUFFIXES) {
    if (upper.endsWith(quote) && upper.length > quote.length) {
      const base = upper.slice(0, -quote.length);
      return `${base}-${quote}`;
    }
  }

  return upper;
}
