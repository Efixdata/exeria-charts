import type { Candle } from "@exeria/charts";
import type { SignalSide } from "./signalCatalog";

export const SMA_CROSS_PERIOD = 24;
export const SCREENER_INTERVAL_LABEL = "1H";

export type SmaCrossHit = {
  side: SignalSide;
  timestamp: number;
  signalPrice: number;
  barIndex: number;
};

export function computeSma(values: number[], period: number): Array<number | null> {
  const result: Array<number | null> = [];

  for (let index = 0; index < values.length; index += 1) {
    if (index < period - 1) {
      result.push(null);
      continue;
    }

    let sum = 0;
    for (let cursor = index - period + 1; cursor <= index; cursor += 1) {
      sum += values[cursor]!;
    }
    result.push(sum / period);
  }

  return result;
}

function isCross(
  upper: Array<number | null>,
  lower: Array<number | null>,
  index: number,
): boolean {
  let cursor = index - 1;

  while (cursor > 2 && upper[cursor] === lower[cursor]) {
    cursor -= 1;
  }

  if (cursor <= 2) {
    return false;
  }

  if (upper[cursor] == null || lower[cursor] == null) {
    return false;
  }

  return upper[cursor]! > lower[cursor]!;
}

/** Mirrors CROSS with LINE=Close, SIGNAL=SMA, ONDN=Sell, ONUP=Buy. */
export function detectSmaCrossSide(
  closes: Array<number | null>,
  smas: Array<number | null>,
  index: number,
): SignalSide | null {
  const close = closes[index];
  const sma = smas[index];

  if (index < 2 || close == null || sma == null) {
    return null;
  }

  if (close < sma) {
    return isCross(closes, smas, index) ? "sell" : null;
  }

  if (close > sma) {
    return isCross(smas, closes, index) ? "buy" : null;
  }

  return null;
}

export function findLastSmaCrossSignal(candles: Candle[]): SmaCrossHit | null {
  if (candles.length < SMA_CROSS_PERIOD + 2) {
    return null;
  }

  const closes = candles.map((candle) => candle.c);
  const smas = computeSma(closes, SMA_CROSS_PERIOD);

  for (let index = candles.length - 1; index >= 2; index -= 1) {
    const side = detectSmaCrossSide(closes, smas, index);
    if (!side) {
      continue;
    }

    const candle = candles[index]!;
    return {
      side,
      timestamp: candle.stamp,
      signalPrice: candle.c,
      barIndex: index,
    };
  }

  return null;
}

export function crossDescription(side: SignalSide): string {
  if (side === "buy") {
    return `On ${SCREENER_INTERVAL_LABEL}, the candle closed above the ${SMA_CROSS_PERIOD}-period SMA — bullish momentum crossed the average and the strategy flagged a potential long entry.`;
  }
  return `On ${SCREENER_INTERVAL_LABEL}, the candle closed below the ${SMA_CROSS_PERIOD}-period SMA — bearish momentum crossed the average and the strategy flagged a potential short entry.`;
}
