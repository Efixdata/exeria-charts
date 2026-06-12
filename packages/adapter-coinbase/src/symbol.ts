const QUOTE_SUFFIXES = ["USDT", "USDC", "USD", "EUR", "GBP"] as const;

const DEFAULT_QUOTE = "USD";

export function toCoinbaseProductId(symbol: string): string {
  const trimmed = symbol.trim().toUpperCase();

  if (trimmed.includes("-")) {
    return trimmed;
  }

  if (trimmed.includes("/")) {
    const [base, quote] = trimmed.split("/");
    if (base && quote) {
      return `${base}-${quote}`;
    }
  }

  const compact = trimmed.replace(/[^A-Z0-9]/g, "");

  for (const quote of QUOTE_SUFFIXES) {
    if (compact.endsWith(quote) && compact.length > quote.length) {
      const base = compact.slice(0, -quote.length);
      return `${base}-${quote}`;
    }
  }

  if (/^[A-Z]{2,10}$/.test(compact)) {
    return `${compact}-${DEFAULT_QUOTE}`;
  }

  return compact;
}
