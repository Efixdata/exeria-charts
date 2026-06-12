const QUOTE_SUFFIXES = ["USDT", "USDC", "USD", "EUR", "GBP"] as const;

const REST_BASE_ALIASES: Record<string, string> = {
  BTC: "XBT",
};

const WS_BASE_ALIASES: Record<string, string> = {
  XBT: "BTC",
};

export function toKrakenRestPair(symbol: string): string {
  const upper = symbol.trim().toUpperCase();

  if (upper.includes("/")) {
    const [base, quote] = upper.split("/");
    if (base && quote) {
      return `${normalizeRestBase(base)}${quote}`;
    }
  }

  const compact = upper.replace(/-/g, "");

  for (const quote of QUOTE_SUFFIXES) {
    if (compact.endsWith(quote) && compact.length > quote.length) {
      const base = compact.slice(0, -quote.length);
      return `${normalizeRestBase(base)}${quote}`;
    }
  }

  return compact;
}

export function toKrakenWsPair(symbol: string): string {
  const upper = symbol.trim().toUpperCase();

  if (upper.includes("/")) {
    const [base, quote] = upper.split("/");
    if (base && quote) {
      return `${normalizeWsBase(base)}/${quote}`;
    }
  }

  const compact = upper.replace(/-/g, "");

  for (const quote of QUOTE_SUFFIXES) {
    if (compact.endsWith(quote) && compact.length > quote.length) {
      const base = compact.slice(0, -quote.length);
      return `${normalizeWsBase(base)}/${quote}`;
    }
  }

  return `${normalizeWsBase(compact)}/USD`;
}

function normalizeRestBase(base: string): string {
  return REST_BASE_ALIASES[base] ?? base;
}

function normalizeWsBase(base: string): string {
  return WS_BASE_ALIASES[base] ?? base;
}
