import type { Candle } from "@exeria/charts";
import { findLastExceedBollingerSignal, type ExceedBollingerHit } from "./exceedBollingerCore";
import { findLastMacdCrossSignal, type MacdCrossHit } from "./macdCrossCore";
import { findLastSmaCrossSignal, type SmaCrossHit } from "./smaCrossCore";
import { getSymbolStrategy } from "./screenerStrategy";

export type ScreenerStrategyHit = SmaCrossHit | ExceedBollingerHit | MacdCrossHit;

export function findLastScreenerStrategySignal(
  candles: Candle[],
  symbol: string,
): ScreenerStrategyHit | null {
  switch (getSymbolStrategy(symbol)) {
    case "exceed-bbands":
      return findLastExceedBollingerSignal(candles);
    case "macd-cross":
      return findLastMacdCrossSignal(candles);
    default:
      return findLastSmaCrossSignal(candles);
  }
}
