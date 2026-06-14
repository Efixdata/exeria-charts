import type { Candle } from "@exeria/charts";
import { resolveNewsBarIndex } from "@exeria/charts";
import type {
  ArbChartSceneFocus,
  ArbSceneAnchor,
  ArbScenePriceField,
} from "@exeria/charts";
import { PIP_SIZE } from "./constants";

function resolvePipSize(candles: Candle[]): number {
  const sample = candles.at(-1)?.c ?? candles[0]?.c ?? 1;
  return sample > 10 ? 0.01 : PIP_SIZE;
}

export function resolveSceneFocusBarIndex(
  candles: Candle[],
  focus: ArbChartSceneFocus,
  detectedAt: number,
): number | null {
  if (!candles.length) {
    return null;
  }

  if (focus.at === "barOffset") {
    const anchorIndex = resolveNewsBarIndex(detectedAt, candles);
    const base = anchorIndex ?? candles.length - 1;
    const offset = focus.barOffset ?? 0;
    return Math.max(0, Math.min(base + offset, candles.length - 1));
  }

  if (focus.at === "stamp" && focus.stamp != null) {
    return resolveNewsBarIndex(focus.stamp, candles);
  }

  const fromDetected = resolveNewsBarIndex(detectedAt, candles);
  if (fromDetected != null) {
    return fromDetected;
  }

  return candles.length - 1;
}

function resolveAnchorBarIndex(
  candles: Candle[],
  anchor: ArbSceneAnchor,
  focusBarIndex: number,
  detectedAt: number,
): number {
  if (anchor.at === "barOffset") {
    const offset = anchor.barOffset ?? 0;
    return Math.max(0, Math.min(focusBarIndex + offset, candles.length - 1));
  }

  if (anchor.at === "stamp" && anchor.stamp != null) {
    return resolveNewsBarIndex(anchor.stamp, candles) ?? focusBarIndex;
  }

  if (anchor.at === "detectedAt") {
    return resolveNewsBarIndex(detectedAt, candles) ?? focusBarIndex;
  }

  return focusBarIndex;
}

function readPriceField(
  candle: Candle,
  field: ArbScenePriceField,
  offsetPips: number | undefined,
  pipSize: number,
): number {
  const base = candle[field];
  const pipOffset = offsetPips ?? 0;
  return base + pipSize * pipOffset;
}

export function resolveSceneAnchor(
  candles: Candle[],
  anchor: ArbSceneAnchor,
  focusBarIndex: number,
  detectedAt: number,
): { stamp: number; offset: number; value: number; _index: number } | null {
  const barIndex = resolveAnchorBarIndex(candles, anchor, focusBarIndex, detectedAt);
  const candle = candles[barIndex];

  if (!candle) {
    return null;
  }

  const priceField = anchor.priceField ?? "c";
  const pipSize = resolvePipSize(candles);

  return {
    stamp: candle.stamp,
    offset: 0,
    value: readPriceField(candle, priceField, anchor.valueOffsetPips, pipSize),
    _index: barIndex,
  };
}
