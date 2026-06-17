import { FOREX_QUOTES, toFinageSymbol } from "./symbol";

export type FinageMarket = "forex" | "stock";

function isCompactForexPair(compact: string): boolean {
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

export function resolveFinageMarket(symbol: string): FinageMarket {
  const trimmed = symbol.trim();

  if (trimmed.includes("/") || trimmed.includes("-")) {
    return "forex";
  }

  const compact = toFinageSymbol(symbol);

  if (isCompactForexPair(compact)) {
    return "forex";
  }

  if (/^[A-Z]{1,5}$/.test(compact)) {
    return "stock";
  }

  return "forex";
}
