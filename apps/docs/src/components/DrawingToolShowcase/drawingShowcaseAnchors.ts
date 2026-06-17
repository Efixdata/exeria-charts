import type { Candle } from "@efixdata/exeria-chart";
import { drawingShowcaseCandles } from "../chartExampleData";

/** Bars in the docs viewport window ending at the penultimate candle. */
const SHOWCASE_VIEW_BARS = 80;

const candles = drawingShowcaseCandles;

function penultimateIndex(): number {
  return Math.max(0, candles.length - 2);
}

/** Penultimate bar — matches the default docs chart viewport (moveToEnd). */
export function penultimateCandle(): Candle {
  return candles[penultimateIndex()]!;
}

/** Map 0..1 across the visible showcase window (1 = penultimate bar). */
export function candleAtViewRatio(ratio: number): Candle {
  const endIndex = penultimateIndex();
  const startIndex = Math.max(0, endIndex - SHOWCASE_VIEW_BARS);
  const clamped = Math.min(1, Math.max(0, ratio));
  const index = startIndex + Math.round((endIndex - startIndex) * clamped);
  return candles[index]!;
}

export { candles as showcaseCandles };
