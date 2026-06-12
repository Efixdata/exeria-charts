export type ScreenerStrategyId = "sma-cross" | "exceed-bbands" | "macd-cross";

const SYMBOL_STRATEGY: Record<string, ScreenerStrategyId> = {
  BTCUSDT: "macd-cross",
  XRPUSDT: "exceed-bbands",
};

export function getSymbolStrategy(symbol: string): ScreenerStrategyId {
  return SYMBOL_STRATEGY[symbol] ?? "sma-cross";
}

export function isExceedBollingerSymbol(symbol: string): boolean {
  return getSymbolStrategy(symbol) === "exceed-bbands";
}

export function isMacdCrossSymbol(symbol: string): boolean {
  return getSymbolStrategy(symbol) === "macd-cross";
}
