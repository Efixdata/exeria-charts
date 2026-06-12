import type { Exchange } from "ccxt";

type MarketLike = {
  id?: string;
  symbol: string;
};

const COMMON_QUOTES = [
  "USDT",
  "USDC",
  "BUSD",
  "USD",
  "EUR",
  "GBP",
  "BTC",
  "ETH",
  "BNB",
  "TRY",
  "AUD",
  "BRL",
] as const;

export function splitCompactSymbol(symbol: string): string {
  const upper = symbol.trim().toUpperCase();

  for (const quote of COMMON_QUOTES) {
    if (upper.endsWith(quote) && upper.length > quote.length) {
      const base = upper.slice(0, -quote.length);
      return `${base}/${quote}`;
    }
  }

  return upper;
}

export function normalizeInputSymbol(symbol: string): string {
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

  return splitCompactSymbol(trimmed);
}

function marketMatchesCompactId(entry: MarketLike, compactId: string): boolean {
  const upper = compactId.toUpperCase();

  if (entry.id?.toUpperCase() === upper) {
    return true;
  }

  if (entry.symbol.replace("/", "").toUpperCase() === upper) {
    return true;
  }

  return false;
}

export function toCcxtSymbol(symbol: string, exchange?: Exchange): string {
  const normalized = normalizeInputSymbol(symbol);

  if (normalized.includes("/")) {
    return normalized;
  }

  if (exchange?.markets) {
    const compact = symbol.trim().toUpperCase();
    for (const market of Object.values(exchange.markets)) {
      if (market && marketMatchesCompactId(market, compact)) {
        return market.symbol;
      }
    }
  }

  return splitCompactSymbol(symbol);
}
