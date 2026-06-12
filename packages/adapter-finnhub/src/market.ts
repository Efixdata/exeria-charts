import { isCompactForexPair } from "./symbol";
import type { FinnhubMarket } from "./types";

const FOREX_EXCHANGES = new Set(["OANDA", "FXCM", "FOREXCOM", "PEPPERSTONE"]);

function looksLikeCryptoCompact(compact: string): boolean {
  return /^(BTC|ETH|SOL|BNB|XRP|ADA|DOGE|DOT|MATIC|LTC|AVAX|LINK|UNI|ATOM|XLM|BCH|FIL|TRX|ETC|NEAR|APT|ARB|OP|SHIB|SUI|PEPE|TON)(USDT|USDC|USD|BTC|ETH)$/i.test(
    compact,
  );
}

export function resolveFinnhubMarket(symbol: string): FinnhubMarket {
  const trimmed = symbol.trim();

  if (trimmed.includes(":")) {
    const exchange = trimmed.split(":")[0]?.toUpperCase() ?? "";
    if (FOREX_EXCHANGES.has(exchange)) {
      return "forex";
    }

    return "crypto";
  }

  if (/^[A-Za-z]{3}[/-][A-Za-z]{3}$/.test(trimmed)) {
    return "forex";
  }

  if (trimmed.includes("/") || trimmed.includes("-")) {
    return "crypto";
  }

  const compact = trimmed.replace(/[/-]/g, "").toUpperCase();

  if (isCompactForexPair(compact)) {
    return "forex";
  }

  if (looksLikeCryptoCompact(compact)) {
    return "crypto";
  }

  if (/^[A-Z]{1,5}$/.test(compact)) {
    return "stock";
  }

  return "stock";
}
