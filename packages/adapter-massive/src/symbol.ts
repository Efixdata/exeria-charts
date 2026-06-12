import type { MassiveMarket } from "./types";

const FIAT_QUOTES = [
  "USD",
  "EUR",
  "GBP",
  "JPY",
  "CHF",
  "AUD",
  "CAD",
  "NZD",
  "HKD",
  "SGD",
] as const;

const CRYPTO_BASES = new Set([
  "BTC",
  "ETH",
  "SOL",
  "XRP",
  "ADA",
  "DOGE",
  "LTC",
  "DOT",
  "AVAX",
  "MATIC",
]);

export function detectMassiveMarket(symbol: string): MassiveMarket {
  const upper = symbol.trim().toUpperCase();

  if (upper.startsWith("X:")) {
    return "crypto";
  }

  if (upper.startsWith("C:")) {
    return "forex";
  }

  if (upper.includes("/")) {
    const [base, quote] = upper.split("/");
    if (base && quote) {
      return classifyPair(base, quote);
    }
  }

  if (upper.includes("-")) {
    const [base, quote] = upper.split("-");
    if (base && quote) {
      return classifyPair(base, quote);
    }
  }

  const compact = upper.replace(/[^A-Z0-9]/g, "");

  for (const quote of FIAT_QUOTES) {
    if (compact.endsWith(quote) && compact.length > quote.length) {
      const base = compact.slice(0, -quote.length);
      return classifyPair(base, quote);
    }
  }

  return "stocks";
}

function classifyPair(base: string, quote: string): MassiveMarket {
  if (CRYPTO_BASES.has(base)) {
    return "crypto";
  }

  if (FIAT_QUOTES.includes(quote as (typeof FIAT_QUOTES)[number])) {
    return "forex";
  }

  return "crypto";
}

export function toMassiveTicker(symbol: string, market?: MassiveMarket): string {
  const resolvedMarket = market ?? detectMassiveMarket(symbol);
  const upper = symbol.trim().toUpperCase();

  if (resolvedMarket === "stocks") {
    return upper.replace(/^STOCK:/, "");
  }

  if (resolvedMarket === "crypto") {
    if (upper.startsWith("X:")) {
      return upper;
    }

    const compact = pairToCompact(upper);
    return `X:${compact}`;
  }

  if (upper.startsWith("C:")) {
    return upper;
  }

  const compact = pairToCompact(upper);
  return `C:${compact}`;
}

export function toWsTicker(symbol: string, market?: MassiveMarket): string {
  const resolvedMarket = market ?? detectMassiveMarket(symbol);
  const massiveTicker = toMassiveTicker(symbol, resolvedMarket);

  if (resolvedMarket === "stocks") {
    return massiveTicker;
  }

  return massiveTicker;
}

function pairToCompact(symbol: string): string {
  const upper = symbol.trim().toUpperCase();

  if (upper.includes("/")) {
    const [base, quote] = upper.split("/");
    return `${base ?? ""}${quote ?? ""}`;
  }

  if (upper.includes("-")) {
    return upper.replace(/-/g, "");
  }

  return upper;
}

export function toDisplaySymbol(symbol: string): string {
  const market = detectMassiveMarket(symbol);
  const ticker = toMassiveTicker(symbol, market);

  if (market === "stocks") {
    return ticker;
  }

  const body = ticker.slice(2);
  if (body.length === 6) {
    return `${body.slice(0, 3)}/${body.slice(3)}`;
  }

  return symbol;
}
