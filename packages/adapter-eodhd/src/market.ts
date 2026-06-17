import { isCompactForexPair, looksLikeCryptoPair } from "./symbol";
import type { EodhdMarket } from "./types";

const EODHD_SUFFIXES = {
  FOREX: ".FOREX",
  CRYPTO: ".CC",
} as const;

export function resolveEodhdMarket(symbol: string): EodhdMarket {
  const trimmed = symbol.trim().toUpperCase();

  if (trimmed.endsWith(EODHD_SUFFIXES.FOREX)) {
    return "forex";
  }

  if (trimmed.endsWith(EODHD_SUFFIXES.CRYPTO)) {
    return "crypto";
  }

  if (trimmed.includes(".")) {
    return "stock";
  }

  if (looksLikeCryptoPair(trimmed)) {
    return "crypto";
  }

  if (/^[A-Z]{3}[/-][A-Z]{3}$/i.test(trimmed)) {
    return "forex";
  }

  const compact = trimmed.replace(/[/-]/g, "");

  if (isCompactForexPair(compact)) {
    return "forex";
  }

  if (/^[A-Z]{1,5}$/.test(compact)) {
    return "stock";
  }

  return "stock";
}
