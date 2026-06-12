import { WATCHLIST_SYMBOLS } from "./constants";

export function getDefaultCompareSymbol(symbolId: string): string {
  const index = WATCHLIST_SYMBOLS.findIndex((item) => item.id === symbolId);
  const nextIndex = index >= 0 ? (index + 1) % WATCHLIST_SYMBOLS.length : 1;
  return WATCHLIST_SYMBOLS[nextIndex]?.id ?? "ETHUSDT";
}
