import type { Candle } from "@exeria/charts";
import type { SignalSide } from "./signalCatalog";
import { SCREENER_INTERVAL_LABEL } from "./smaCrossCore";

/** Default inputs shipped with the built-in `BBAND` script. */
export const BBAND_PERIODS = 15;
export const BBAND_DEVIATIONS = 2.5;

export type ExceedBollingerHit = {
  side: SignalSide;
  timestamp: number;
  signalPrice: number;
  barIndex: number;
};

function computeStdDev(values: number[], index: number, period: number): number | null {
  if (index < period - 1) {
    return null;
  }

  let mean = 0;
  for (let cursor = index - period + 1; cursor <= index; cursor += 1) {
    mean += values[cursor]!;
  }
  mean /= period;

  let variance = 0;
  for (let cursor = index - period + 1; cursor <= index; cursor += 1) {
    const delta = values[cursor]! - mean;
    variance += delta * delta;
  }

  return Math.sqrt(variance / period);
}

export function computeBollingerBands(
  closes: number[],
  period = BBAND_PERIODS,
  deviations = BBAND_DEVIATIONS,
): { upper: Array<number | null>; lower: Array<number | null> } {
  const upper: Array<number | null> = [];
  const lower: Array<number | null> = [];

  for (let index = 0; index < closes.length; index += 1) {
    if (index < period - 1) {
      upper.push(null);
      lower.push(null);
      continue;
    }

    let sum = 0;
    for (let cursor = index - period + 1; cursor <= index; cursor += 1) {
      sum += closes[cursor]!;
    }
    const sma = sum / period;
    const std = computeStdDev(closes, index, period);

    if (std == null) {
      upper.push(null);
      lower.push(null);
      continue;
    }

    const bandOffset = std * deviations;
    upper.push(sma + bandOffset);
    lower.push(sma - bandOffset);
  }

  return { upper, lower };
}

/**
 * Mirrors `EXCEED` with Close wired to HIGH/LOW: close above upper → sell, below lower → buy.
 */
export function detectExceedBollingerSide(
  close: number,
  upper: number | null,
  lower: number | null,
): SignalSide | null {
  if (upper == null || lower == null) {
    return null;
  }

  if (close > upper) {
    return "sell";
  }

  if (close < lower) {
    return "buy";
  }

  return null;
}

export function findLastExceedBollingerSignal(candles: Candle[]): ExceedBollingerHit | null {
  if (candles.length < BBAND_PERIODS + 2) {
    return null;
  }

  const closes = candles.map((candle) => candle.c);
  const { upper, lower } = computeBollingerBands(closes);

  for (let index = candles.length - 1; index >= BBAND_PERIODS - 1; index -= 1) {
    const side = detectExceedBollingerSide(closes[index]!, upper[index], lower[index]);
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

export function exceedBollingerDescription(side: SignalSide): string {
  if (side === "buy") {
    return `On ${SCREENER_INTERVAL_LABEL}, the close pushed below the lower Bollinger Band (${BBAND_PERIODS}, ${BBAND_DEVIATIONS}σ) and EXCEED flagged a potential buy as price exceeded the band to the downside.`;
  }

  return `On ${SCREENER_INTERVAL_LABEL}, the close pushed above the upper Bollinger Band (${BBAND_PERIODS}, ${BBAND_DEVIATIONS}σ) and EXCEED flagged a potential sell as price exceeded the band to the upside.`;
}
