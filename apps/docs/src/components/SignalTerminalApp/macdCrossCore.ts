import type { Candle } from "@efixdata/exeria-chart";
import type { SignalSide } from "./signalCatalog";
import { SCREENER_INTERVAL_LABEL } from "./smaCrossCore";

/** Default inputs shipped with the built-in `MACD` script. */
export const MACD_FAST_PERIOD = 12;
export const MACD_SLOW_PERIOD = 26;
export const MACD_SIGNAL_PERIOD = 9;

export type MacdCrossHit = {
  side: SignalSide;
  timestamp: number;
  signalPrice: number;
  barIndex: number;
};

type NumericSeries = {
  getValue: (index: number) => number | null;
};

type EmaState = {
  getValue: (index: number) => number | null;
};

function computeSimpleMa(series: NumericSeries, index: number, period: number): number | null {
  if (index < period - 1) {
    return null;
  }

  let sum = 0;
  for (let cursor = index - period + 1; cursor <= index; cursor += 1) {
    const value = series.getValue(cursor);
    if (value == null) {
      return null;
    }
    sum += value;
  }

  return sum / period;
}

function computeEma(
  series: NumericSeries,
  index: number,
  period: number,
  previous: EmaState,
): number | null {
  const value = series.getValue(index);
  if (index < period - 1 || value == null) {
    return null;
  }

  const yesterday = previous.getValue(index - 1);
  if (yesterday == null) {
    return computeSimpleMa(series, index, period);
  }

  const alpha = 2 / (period + 1);
  return alpha * value + (1 - alpha) * yesterday;
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

export function computeMacd(
  closes: number[],
  fastPeriod = MACD_FAST_PERIOD,
  slowPeriod = MACD_SLOW_PERIOD,
  signalPeriod = MACD_SIGNAL_PERIOD,
): { line: Array<number | null>; signal: Array<number | null> } {
  const closeSeries: NumericSeries = {
    getValue: (index) => closes[index] ?? null,
  };
  const fastEma: Array<number | null> = [];
  const slowEma: Array<number | null> = [];
  const line: Array<number | null> = [];
  const signal: Array<number | null> = [];

  const fastState: EmaState = { getValue: (index) => fastEma[index] ?? null };
  const slowState: EmaState = { getValue: (index) => slowEma[index] ?? null };
  const signalState: EmaState = { getValue: (index) => signal[index] ?? null };

  for (let index = 0; index < closes.length; index += 1) {
    fastEma.push(computeEma(closeSeries, index, fastPeriod, fastState));
    slowEma.push(computeEma(closeSeries, index, slowPeriod, slowState));

    const fast = fastEma[index];
    const slow = slowEma[index];
    if (fast == null || slow == null) {
      line.push(null);
      signal.push(null);
      continue;
    }

    const lineValue = fast - slow;
    line.push(lineValue);

    const lineSeries: NumericSeries = {
      getValue: (cursor) => line[cursor] ?? null,
    };
    signal.push(computeEma(lineSeries, index, signalPeriod, signalState));
  }

  return { line, signal };
}

/**
 * Mirrors default `CROSS` with LINE=MACDLine and SIGNAL=MACDSignal (ONDN=Buy, ONUP=Sell).
 */
export function detectMacdCrossSide(
  line: Array<number | null>,
  signal: Array<number | null>,
  index: number,
): SignalSide | null {
  const macd = line[index];
  const macdSignal = signal[index];

  if (index < 2 || macd == null || macdSignal == null) {
    return null;
  }

  if (macd < macdSignal) {
    return isCross(line, signal, index) ? "buy" : null;
  }

  if (macd > macdSignal) {
    return isCross(signal, line, index) ? "sell" : null;
  }

  return null;
}

export function findLastMacdCrossSignal(candles: Candle[]): MacdCrossHit | null {
  const minBars = MACD_SLOW_PERIOD + MACD_SIGNAL_PERIOD + 4;
  if (candles.length < minBars) {
    return null;
  }

  const closes = candles.map((candle) => candle.c);
  const { line, signal } = computeMacd(closes);

  for (let index = candles.length - 1; index >= 2; index -= 1) {
    const side = detectMacdCrossSide(line, signal, index);
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

export function macdCrossDescription(side: SignalSide): string {
  if (side === "buy") {
    return `On ${SCREENER_INTERVAL_LABEL}, the MACD line (${MACD_FAST_PERIOD}, ${MACD_SLOW_PERIOD}, ${MACD_SIGNAL_PERIOD}) crossed below its signal line and CROSS flagged a potential buy using the standard MACD crossover wiring.`;
  }

  return `On ${SCREENER_INTERVAL_LABEL}, the MACD line (${MACD_FAST_PERIOD}, ${MACD_SLOW_PERIOD}, ${MACD_SIGNAL_PERIOD}) crossed above its signal line and CROSS flagged a potential sell using the standard MACD crossover wiring.`;
}
